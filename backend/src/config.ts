/** Configuração lida do ambiente. Sem banco de dados, sem estado persistente. */

function int(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Booleano de três estados: indefinido quando a variável não foi declarada. */
function bool(name: string): boolean | undefined {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return undefined;
  return raw === '1' || raw === 'true' || raw === 'yes';
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
  // Uma auditoria por vez é o padrão: duas instâncias do Chromium carregando
  // páginas ao mesmo tempo não cabem em uma máquina de 1 GB. Suba este número
  // apenas com RAM de sobra — a fila já segura os visitantes simultâneos.
  maxConcurrency: int('FAST_MAX_CONCURRENCY', 1),
  /** Quantos visitantes podem esperar na fila antes de a resposta virar "volte depois". */
  maxQueue: int('FAST_MAX_QUEUE', 20),
  /**
   * Teto da auditoria inteira — coleta, módulos e IA. O FAST_AUDIT_TIMEOUT
   * cobre só a coleta; este aqui é a rede de segurança contra um site que
   * responde devagar em cada etapa e nunca estoura nenhuma delas.
   */
  auditHardTimeout: int('FAST_AUDIT_HARD_TIMEOUT', 180_000),
  // Teto das rotas de API baratas (/api/modules, /api/report/pdf…). Generoso de
  // propósito: quem trava aqui é robô, não visitante.
  rateLimit: int('FAST_RATE_LIMIT', 60),
  // Auditorias iniciadas por IP a cada minuto. Cada uma abre um Chromium, então
  // este é o número que realmente protege a máquina.
  auditRateLimit: int('FAST_AUDIT_RATE_LIMIT', 12),

  // ---- Ciclo de vida do Chromium ----
  // O navegador é caro para subir (~1 s) e caro para manter: a memória cresce a
  // cada página analisada. Mantê-lo por um tempo curto de ociosidade paga o
  // custo de subida entre auditorias em sequência; fechá-lo depois devolve
  // algumas centenas de megabytes ao sistema.
  /** Fecha o navegador após este tempo sem uso. 0 desliga o fechamento. */
  browserIdleMs: int('FAST_BROWSER_IDLE_MS', 90_000),
  /** Recicla o navegador a cada N usos. 0 desliga a reciclagem. */
  browserMaxUses: int('FAST_BROWSER_MAX_USES', 8),
  /** Força (1) ou desliga (0) o modo de baixa memória; vazio = detecta a RAM. */
  lowMemory: bool('FAST_LOW_MEMORY'),

  // Módulo 10 — análise por IA via Ollama (self-hosted).
  // Habilitado quando FAST_AI_URL está definido; sem URL, o módulo é desativado.
  // Parâmetros seguem a receita já comprovada no Flexi (think desligado, auth
  // bearer, keep_alive, num_predict alto para a resposta longa em JSON).
  ai: {
    url: process.env.FAST_AI_URL?.trim() || '',
    model: process.env.FAST_AI_MODEL?.trim() || 'qwen3.6:27b',
    token: process.env.FAST_AI_TOKEN?.trim() || 'ollama',
    timeout: int('FAST_AI_TIMEOUT', 120_000),
    temperature: Number.parseFloat(process.env.FAST_AI_TEMPERATURE ?? '0.3'),
    numCtx: int('FAST_AI_NUM_CTX', 8192),
    numPredict: int('FAST_AI_NUM_PREDICT', 3072),
    keepAlive: process.env.FAST_AI_KEEP_ALIVE?.trim() || '24h',
  },
} as const;

export const aiEnabled = (): boolean => Boolean(config.ai.url);

export const isProduction = config.env === 'production';
