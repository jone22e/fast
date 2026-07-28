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

  ai: {
    apiKey: process.env.ANTHROPIC_API_KEY?.trim() || null,
    model: process.env.FAST_AI_MODEL?.trim() || 'claude-opus-5',
    effort: (process.env.FAST_AI_EFFORT?.trim() || 'medium') as
      | 'low'
      | 'medium'
      | 'high'
      | 'xhigh'
      | 'max',
  },
} as const;

export const isProduction = config.env === 'production';
