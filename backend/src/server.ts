import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import { aiEnabled, config, isProduction } from './config.js';
import { closeBrowser } from './core/browser.js';
import { registerAllPlugins } from './plugins/index.js';
import { auditRoutes } from './routes/audit.js';
import { reportRoutes } from './routes/report.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.resolve(here, '../../frontend/dist');

/**
 * Cabeçalhos de segurança emitidos pela própria aplicação.
 *
 * O nginx também os declara, mas só no bloco HTTPS — e atrás de um CDN
 * (CloudFront) quem termina o TLS é o CDN: a origem é buscada por HTTP e
 * aquele bloco nunca roda. Emitindo aqui, a resposta sai protegida em
 * qualquer topologia (direto, atrás de proxy ou atrás de CDN).
 *
 * A CSP corresponde ao que a SPA realmente usa: nenhum script de terceiros,
 * estilos inline vindos dos bindings :style do Vue, imagens e fontes locais
 * ou em data: URI, e chamadas de rede apenas para a própria origem.
 */
const SECURITY_HEADERS: ReadonlyArray<readonly [string, string]> = [
  ['strict-transport-security', 'max-age=31536000; includeSubDomains'],
  ['x-content-type-options', 'nosniff'],
  ['x-frame-options', 'SAMEORIGIN'],
  ['referrer-policy', 'strict-origin-when-cross-origin'],
  ['permissions-policy', 'geolocation=(), microphone=(), camera=(), interest-cohort=()'],
  [
    'content-security-policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      'upgrade-insecure-requests',
    ].join('; '),
  ],
];

async function main(): Promise<void> {
  registerAllPlugins();

  const app = Fastify({
    logger: isProduction
      ? { level: 'info' }
      : { level: 'debug', transport: { target: 'pino-pretty' } },
    trustProxy: true,
    bodyLimit: 1_048_576,
  });

  // Não sobrescreve o que o nginx já tenha colocado (deploy sem CDN): o
  // `onSend` roda depois da rota e antes do proxy, então basta não duplicar
  // aqui o que o próprio Fastify já definiu.
  app.addHook('onSend', async (_request, reply, payload) => {
    for (const [name, value] of SECURITY_HEADERS) {
      if (!reply.hasHeader(name)) reply.header(name, value);
    }
    return payload;
  });

  await app.register(cors, {
    origin: config.corsOrigin.length > 0 ? config.corsOrigin : true,
  });

  await app.register(rateLimit, {
    max: config.rateLimit,
    timeWindow: '1 minute',
    // O SSE mantém a conexão aberta; limitamos apenas o início das auditorias.
    keyGenerator: (req) => req.ip,
    // Só a API entra na conta. Uma única visita já pede index.html, os assets,
    // o favicon e o manifest; e um auditor externo (a própria FAST, inclusive)
    // lê llms.txt, robots.txt e sitemap.xml na sequência. Com o limite valendo
    // para tudo, esses arquivos voltavam com erro e eram reportados como
    // ausentes ou como link quebrado.
    // As rotas de auditoria têm limite próprio (routes/audit.ts): mais baixo,
    // porque cada auditoria custa um navegador, e recusado de um jeito que o
    // usuário entende — dentro do stream, com o tempo de espera.
    allowList: (req) => !req.url.startsWith('/api/') || req.url.startsWith('/api/audit'),
    errorResponseBuilder: (_req, context) => {
      // Precisa ser um Error de verdade: o @fastify/rate-limit dá `throw` no
      // que esta função retorna, e um objeto simples cai no handler genérico
      // do Fastify como HTTP 500 — o cliente lia "erro do servidor" no lugar
      // de "excesso de requisições".
      const error = new Error(
        'Muitas auditorias em pouco tempo. Aguarde um minuto e tente novamente.',
      ) as Error & { statusCode: number };
      error.statusCode = context.statusCode ?? 429;
      return error;
    },
  });

  app.get('/api/health', async () => ({
    status: 'ok',
    version: '1.0.0',
    aiEnabled: aiEnabled(),
    uptime: Math.round(process.uptime()),
  }));

  await app.register(auditRoutes);
  await app.register(reportRoutes);

  // Em produção o próprio Fastify serve o frontend compilado.
  if (existsSync(frontendDist)) {
    await app.register(fastifyStatic, { root: frontendDist, prefix: '/' });

    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api/')) {
        return reply.code(404).send({ error: 'Rota não encontrada.' });
      }
      return reply.sendFile('index.html');
    });
  }

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info({ signal }, 'encerrando');
    await app.close();
    await closeBrowser();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  await app.listen({ host: config.host, port: config.port });
  app.log.info(`FAST rodando em http://${config.host}:${config.port}`);
}

main().catch((error) => {
  console.error('Falha ao iniciar o servidor:', error);
  process.exit(1);
});
