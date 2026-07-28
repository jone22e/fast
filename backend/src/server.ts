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

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.resolve(here, '../../frontend/dist');

async function main(): Promise<void> {
  registerAllPlugins();

  const app = Fastify({
    logger: isProduction
      ? { level: 'info' }
      : { level: 'debug', transport: { target: 'pino-pretty' } },
    trustProxy: true,
    bodyLimit: 1_048_576,
  });

  await app.register(cors, {
    origin: config.corsOrigin.length > 0 ? config.corsOrigin : true,
  });

  await app.register(rateLimit, {
    max: config.rateLimit,
    timeWindow: '1 minute',
    // O SSE mantém a conexão aberta; limitamos apenas o início das auditorias.
    keyGenerator: (req) => req.ip,
    errorResponseBuilder: () => ({
      error: 'Muitas auditorias em pouco tempo. Aguarde um minuto e tente novamente.',
    }),
  });

  app.get('/api/health', async () => ({
    status: 'ok',
    version: '1.0.0',
    aiEnabled: aiEnabled(),
    uptime: Math.round(process.uptime()),
  }));

  await app.register(auditRoutes);

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
