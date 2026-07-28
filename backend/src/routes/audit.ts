import type { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import { config } from '../config.js';
import { runAudit } from '../core/engine.js';
import { getPlugins } from '../core/registry.js';
import type { AuditEvent } from '../core/types.js';

/** Normaliza e valida a URL informada, bloqueando destinos internos. */
function normalizeUrl(raw: string): URL {
  const trimmed = raw.trim();
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new Error('URL inválida. Informe um endereço no formato https://exemplo.com');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Apenas os protocolos http e https são suportados.');
  }

  const host = url.hostname.toLowerCase();

  // Bloqueio de SSRF: nada de rede interna.
  const blocked =
    host === 'localhost' ||
    host === '::1' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^0\./.test(host);

  if (blocked) {
    throw new Error('Endereços de rede interna não podem ser auditados.');
  }

  if (!host.includes('.')) {
    throw new Error('Informe um domínio completo, por exemplo https://exemplo.com');
  }

  return url;
}

/** Semáforo simples para limitar auditorias simultâneas. */
class Semaphore {
  private active = 0;
  private queue: (() => void)[] = [];

  constructor(private readonly limit: number) {}

  get pending(): number {
    return this.queue.length;
  }

  async acquire(): Promise<() => void> {
    if (this.active < this.limit) {
      this.active++;
    } else {
      await new Promise<void>((resolve) => this.queue.push(resolve));
      this.active++;
    }

    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.active--;
      this.queue.shift()?.();
    };
  }
}

const semaphore = new Semaphore(config.maxConcurrency);

const querySchema = z.object({ url: z.string().min(3).max(2048) });

export async function auditRoutes(app: FastifyInstance): Promise<void> {
  /** Lista os módulos registrados — usado pela UI antes de iniciar. */
  app.get('/api/modules', async () => ({
    modules: getPlugins().map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      checks: p.checks,
      weight: p.weight,
    })),
    aiEnabled: Boolean(config.ai.apiKey),
  }));

  /**
   * Auditoria com progresso em tempo real via Server-Sent Events.
   * Nada é persistido: o resultado existe apenas durante a conexão.
   */
  app.get('/api/audit/stream', async (request, reply: FastifyReply) => {
    const parsed = querySchema.safeParse(request.query);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetro "url" é obrigatório.' });
    }

    let url: URL;
    try {
      url = normalizeUrl(parsed.data.url);
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'URL inválida.' });
    }

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    let closed = false;
    request.raw.on('close', () => {
      closed = true;
    });

    const send = (event: AuditEvent): void => {
      if (closed) return;
      reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    // Mantém a conexão viva atrás de proxies durante etapas longas.
    const heartbeat = setInterval(() => {
      if (!closed) reply.raw.write(': keep-alive\n\n');
    }, 15_000);

    if (semaphore.pending > 0) {
      send({
        type: 'progress',
        stage: 'fila',
        message: `Aguardando na fila (${semaphore.pending} auditoria(s) à frente)…`,
        percent: 1,
      });
    }

    const release = await semaphore.acquire();

    try {
      await runAudit(url.toString(), send);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro inesperado durante a auditoria.';
      request.log.error({ err: error, url: url.toString() }, 'audit failed');
      send({ type: 'error', message });
    } finally {
      release();
      clearInterval(heartbeat);
      if (!closed) reply.raw.end();
    }
  });

  /** Versão sem streaming, para integrações via API REST. */
  app.get('/api/audit', async (request, reply) => {
    const parsed = querySchema.safeParse(request.query);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetro "url" é obrigatório.' });
    }

    let url: URL;
    try {
      url = normalizeUrl(parsed.data.url);
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'URL inválida.' });
    }

    const release = await semaphore.acquire();
    try {
      const report = await runAudit(url.toString(), () => undefined);
      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro inesperado durante a auditoria.';
      request.log.error({ err: error, url: url.toString() }, 'audit failed');
      return reply.code(502).send({ error: message });
    } finally {
      release();
    }
  });
}
