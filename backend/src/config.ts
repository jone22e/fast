/** Configuração lida do ambiente. Sem banco de dados, sem estado persistente. */

function int(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  host: process.env.HOST ?? '127.0.0.1',
  port: int('PORT', 3001),
  domain: process.env.FAST_DOMAIN ?? 'fast.openflexi.com',
  corsOrigin: (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  auditTimeout: int('FAST_AUDIT_TIMEOUT', 120_000),
  navTimeout: int('FAST_NAV_TIMEOUT', 45_000),
  maxConcurrency: int('FAST_MAX_CONCURRENCY', 2),
  rateLimit: int('FAST_RATE_LIMIT', 10),

  // Módulo 10 — análise por IA via Ollama (self-hosted).
  // Habilitado quando FAST_AI_URL está definido; sem URL, o módulo é desativado.
  ai: {
    url: process.env.FAST_AI_URL?.trim() || '',
    model: process.env.FAST_AI_MODEL?.trim() || 'qwen3.6:27b',
    timeout: int('FAST_AI_TIMEOUT', 120_000),
    temperature: Number.parseFloat(process.env.FAST_AI_TEMPERATURE ?? '0.3'),
  },
} as const;

export const aiEnabled = (): boolean => Boolean(config.ai.url);

export const isProduction = config.env === 'production';
