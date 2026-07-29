import type { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import { aiEnabled, config } from '../config.js';
import { runAudit } from '../core/engine.js';
import { getPlugins } from '../core/registry.js';
import type { AuditEvent } from '../core/types.js';
import { getCatalog, normalizeLang } from '../i18n/index.js';
import type { Lang } from '../i18n/index.js';

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

interface Waiter {
  resolve: () => void;
  cancelled: boolean;
}

/**
 * Fila de auditorias.
 *
 * Uma auditoria por vez (FAST_MAX_CONCURRENCY) — o restante espera. A fila é o
 * que impede que dez visitantes simultâneos virem dez instâncias do Chromium e
 * derrubem a máquina: em vez de todos serem atendidos mal, cada um é atendido
 * na sua vez, sabendo em que posição está.
 *
 * A fila tem teto. Passado ele, é melhor recusar na hora — com uma mensagem
 * clara — do que aceitar uma espera que ninguém vai aguardar.
 */
class Queue {
  private active = 0;
  private waiters: Waiter[] = [];

  constructor(
    private readonly limit: number,
    private readonly maxWaiting: number,
  ) {}

  get waiting(): number {
    return this.waiters.length;
  }

  get isFull(): boolean {
    return this.waiters.length >= this.maxWaiting;
  }

  /**
   * Entra na fila. Devolve a espera, a posição atual (1 = próximo da fila) e
   * uma desistência — usada quando o visitante fecha a aba antes da vez dele.
   */
  enter(): { ready: Promise<() => void>; position: () => number; give_up: () => void } {
    let waiter: Waiter | null = null;

    const ready = (async (): Promise<() => void> => {
      if (this.active >= this.limit) {
        await new Promise<void>((resolve) => {
          waiter = { resolve, cancelled: false };
          this.waiters.push(waiter);
        });
      }
      this.active += 1;

      let released = false;
      return () => {
        if (released) return;
        released = true;
        this.active -= 1;
        this.next();
      };
    })();

    return {
      ready,
      position: () => (waiter ? this.waiters.indexOf(waiter) + 1 : 0),
      give_up: () => {
        if (!waiter) return;
        waiter.cancelled = true;
        const at = this.waiters.indexOf(waiter);
        if (at >= 0) this.waiters.splice(at, 1);
      },
    };
  }

  /** Chama o próximo da fila, pulando quem já desistiu. */
  private next(): void {
    while (this.waiters.length > 0) {
      const waiter = this.waiters.shift();
      if (waiter && !waiter.cancelled) {
        waiter.resolve();
        return;
      }
    }
  }
}

const queue = new Queue(config.maxConcurrency, config.maxQueue);

/**
 * Contagem de auditorias iniciadas por IP, em janela deslizante.
 *
 * O limite geral da API não serve aqui: uma auditoria custa um Chromium e um
 * minuto de CPU, enquanto as demais rotas são baratas. E o limite precisa ser
 * amigável — quem clica em "Analisar" duas vezes seguidas não é um abuso. Por
 * isso o teto é por minuto, generoso, e a recusa vem com o tempo de espera.
 */
class AuditWindow {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  take(key: string): { allowed: boolean; retryAfterSec: number } {
    const now = Date.now();
    const recent = (this.hits.get(key) ?? []).filter((at) => now - at < this.windowMs);

    if (recent.length >= this.limit) {
      const oldest = recent[0] ?? now;
      this.hits.set(key, recent);
      return {
        allowed: false,
        retryAfterSec: Math.max(1, Math.ceil((this.windowMs - (now - oldest)) / 1000)),
      };
    }

    recent.push(now);
    this.hits.set(key, recent);

    // Limpeza preguiçosa: sem isto o mapa cresceria com cada IP já esquecido.
    if (this.hits.size > 5_000) {
      for (const [ip, times] of this.hits) {
        if (times.every((at) => now - at >= this.windowMs)) this.hits.delete(ip);
      }
    }

    return { allowed: true, retryAfterSec: 0 };
  }
}

const auditWindow = new AuditWindow(config.auditRateLimit, 60_000);

/**
 * Textos da fila e do cancelamento, nos quatro idiomas.
 *
 * Ficam aqui, e não no catálogo do relatório, porque são mensagens da rota:
 * chegam antes de existir qualquer relatório para traduzir.
 */
const QUEUE_TEXTS: Record<Lang, { position: (n: number) => string; full: string; timeout: (s: number) => string }> = {
  pt: {
    position: (n) => `Você é o ${n}º da fila — cada auditoria leva cerca de um minuto…`,
    full: 'A fila de auditorias está cheia neste momento. Tente novamente em alguns minutos.',
    timeout: (s) =>
      `A auditoria passou de ${s}s e foi cancelada. Sites muito pesados ou que não respondem podem estourar esse limite — tente novamente.`,
  },
  en: {
    position: (n) => `You are number ${n} in the queue — each audit takes about a minute…`,
    full: 'The audit queue is full right now. Please try again in a few minutes.',
    timeout: (s) =>
      `The audit went past ${s}s and was cancelled. Very heavy or unresponsive sites can exceed this limit — please try again.`,
  },
  es: {
    position: (n) => `Usted es el número ${n} de la fila: cada auditoría tarda cerca de un minuto…`,
    full: 'La fila de auditorías está llena en este momento. Inténtelo de nuevo en unos minutos.',
    timeout: (s) =>
      `La auditoría superó los ${s}s y fue cancelada. Los sitios muy pesados o que no responden pueden exceder este límite; inténtelo de nuevo.`,
  },
  zh: {
    position: (n) => `您在队列中排第 ${n} 位——每次审计约需一分钟……`,
    full: '当前审计队列已满，请几分钟后再试。',
    timeout: (s) => `审计超过 ${s} 秒已被取消。过于沉重或无响应的网站可能超出该上限，请重试。`,
  },
};

const querySchema = z.object({
  url: z.string().min(3).max(2048),
  /** Idioma do relatório e da análise por IA; normalizado adiante. */
  lang: z.string().max(35).optional(),
});

export async function auditRoutes(app: FastifyInstance): Promise<void> {
  /** Lista os módulos registrados — usado pela UI antes de iniciar. */
  app.get('/api/modules', async (request) => {
    const query = request.query as { lang?: string };
    const lang = normalizeLang(query.lang ?? request.headers['accept-language']);
    const catalog = await getCatalog(lang);

    return {
      lang,
      modules: getPlugins().map((p) => ({
        id: p.id,
        name: catalog.plugins[p.id]?.name ?? p.name,
        description: catalog.plugins[p.id]?.description ?? p.description,
        category: p.category,
        checks: p.checks,
        weight: p.weight,
      })),
      aiEnabled: aiEnabled(),
    };
  });

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

    // O excesso é recusado DENTRO do stream, e não com um 429: o EventSource
    // não deixa o navegador ler o corpo de uma resposta de erro, então um 429
    // aqui chegaria ao usuário como "conexão interrompida" — ou, pior, como o
    // JSON cru do erro em uma aba aberta na mão.
    const quota = auditWindow.take(request.ip);
    if (!quota.allowed) {
      send({
        type: 'error',
        message: `Você iniciou várias auditorias em sequência. Aguarde ${quota.retryAfterSec}s e tente novamente — cada análise abre um navegador real e leva cerca de um minuto.`,
      });
      clearInterval(heartbeat);
      if (!closed) reply.raw.end();
      return;
    }

    // Sem ?lang explícito, vale o Accept-Language do navegador.
    const lang = normalizeLang(parsed.data.lang ?? request.headers['accept-language']);
    const texts = QUEUE_TEXTS[lang];

    if (queue.isFull) {
      send({ type: 'error', message: texts.full });
      clearInterval(heartbeat);
      if (!closed) reply.raw.end();
      return;
    }

    const ticket = queue.enter();

    // Avisa a posição enquanto espera. Sem isso, quem está na fila vê uma
    // barra parada e conclui que travou.
    let announced = -1;
    const queueTicker = setInterval(() => {
      const position = ticket.position();
      if (position <= 0 || position === announced || closed) return;
      announced = position;
      send({ type: 'progress', stage: 'fila', message: texts.position(position), percent: 1 });
    }, 1_000);

    const initialPosition = ticket.position();
    if (initialPosition > 0) {
      announced = initialPosition;
      send({
        type: 'progress',
        stage: 'fila',
        message: texts.position(initialPosition),
        percent: 1,
      });
    }

    // Se o visitante fecha a aba antes da vez dele, o lugar na fila é devolvido
    // — ninguém espera por uma auditoria que já não tem para quem ir.
    request.raw.on('close', () => ticket.give_up());

    const release = await ticket.ready;
    clearInterval(queueTicker);

    // Cancelamento: por tempo (o teto vale para a auditoria inteira, não só
    // para a coleta) e por desistência do visitante.
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), config.auditHardTimeout);
    request.raw.on('close', () => controller.abort());

    try {
      if (closed) return;
      await runAudit(url.toString(), send, lang, controller.signal);
    } catch (error) {
      const timedOut = controller.signal.aborted && !closed;
      const message = timedOut
        ? texts.timeout(Math.round(config.auditHardTimeout / 1000))
        : error instanceof Error
          ? error.message
          : 'Erro inesperado durante a auditoria.';

      request.log.error({ err: error, url: url.toString(), timedOut }, 'audit failed');
      send({ type: 'error', message });
    } finally {
      clearTimeout(deadline);
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

    const quota = auditWindow.take(request.ip);
    if (!quota.allowed) {
      return reply
        .code(429)
        .header('retry-after', String(quota.retryAfterSec))
        .send({
          error: `Muitas auditorias em sequência. Tente novamente em ${quota.retryAfterSec}s.`,
          retryAfter: quota.retryAfterSec,
        });
    }

    const lang = normalizeLang(parsed.data.lang ?? request.headers['accept-language']);

    if (queue.isFull) {
      return reply.code(503).header('retry-after', '60').send({ error: QUEUE_TEXTS[lang].full });
    }

    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), config.auditHardTimeout);
    const release = await queue.enter().ready;

    try {
      const report = await runAudit(url.toString(), () => undefined, lang, controller.signal);
      return report;
    } catch (error) {
      const message = controller.signal.aborted
        ? QUEUE_TEXTS[lang].timeout(Math.round(config.auditHardTimeout / 1000))
        : error instanceof Error
          ? error.message
          : 'Erro inesperado durante a auditoria.';
      request.log.error({ err: error, url: url.toString() }, 'audit failed');
      return reply.code(controller.signal.aborted ? 504 : 502).send({ error: message });
    } finally {
      clearTimeout(deadline);
      release();
    }
  });
}
