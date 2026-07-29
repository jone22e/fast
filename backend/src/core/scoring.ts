import type { CategoryId, Check, Difficulty, Impact, Priority, Severity } from './types.js';

const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

const IMPACT_WEIGHT: Record<Impact, number> = { alto: 3, medio: 2, baixo: 1 };
const DIFFICULTY_BONUS: Record<Difficulty, number> = { facil: 2, media: 1, dificil: 0 };

/**
 * Prioridade = gravidade + impacto + facilidade de correção.
 * Correções fáceis de alto impacto sobem na lista.
 */
export function computePriority(issue: {
  severity: Severity;
  impact: Impact;
  difficulty: Difficulty;
}): Priority {
  const score =
    SEVERITY_WEIGHT[issue.severity] * 2 +
    IMPACT_WEIGHT[issue.impact] * 2 +
    DIFFICULTY_BONUS[issue.difficulty];

  if (score >= 14) return 'alta';
  if (score >= 9) return 'media';
  return 'baixa';
}

/** Média ponderada das verificações de um plugin, em escala 0..100. */
export function scoreFromChecks(checks: Check[]): number {
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return 100;
  const weighted = checks.reduce((sum, c) => sum + clamp01(c.score) * c.weight, 0);
  return Math.round((weighted / totalWeight) * 100);
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Pontuação linear com faixa boa/ruim. Acima de `good` → 1, abaixo de `poor` → 0.
 * Aceita métricas invertidas (quanto menor, melhor) quando good < poor.
 */
export function scale(value: number | null, good: number, poor: number): number {
  if (value === null || !Number.isFinite(value)) return 0.5;
  if (good < poor) {
    if (value <= good) return 1;
    if (value >= poor) return 0;
    return 1 - (value - good) / (poor - good);
  }
  if (value >= good) return 1;
  if (value <= poor) return 0;
  return (value - poor) / (good - poor);
}

export function bool(value: boolean): number {
  return value ? 1 : 0;
}

/** Nota geral = média ponderada das categorias. */
export function overallScore(
  categories: { score: number; weight: number }[],
): number {
  const totalWeight = categories.reduce((s, c) => s + c.weight, 0);
  if (totalWeight === 0) return 0;
  return Math.round(categories.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight);
}

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  performance: 'Performance',
  seo: 'SEO',
  geo: 'GEO',
  content: 'Conteúdo',
  security: 'Segurança',
  protection: 'Proteção & Exposição',
  accessibility: 'Acessibilidade',
  infrastructure: 'Infraestrutura',
  lgpd: 'LGPD',
  mobile: 'Mobile',
  ux: 'UX',
};

export function priorityRank(priority: Priority): number {
  return priority === 'alta' ? 0 : priority === 'media' ? 1 : 2;
}

export function severityRank(severity: Severity): number {
  return 5 - SEVERITY_WEIGHT[severity];
}
