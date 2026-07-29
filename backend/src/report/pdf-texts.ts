import type { Lang } from '../i18n/types.js';

/**
 * Rótulos do PDF.
 *
 * O corpo do relatório já chega traduzido do motor; o que falta aqui são as
 * palavras da própria página impressa — cabeçalhos de seção, legendas e
 * unidades de tempo.
 */
export interface PdfTexts {
  kicker: string;
  analyzedAt: string;
  stats: { issues: string; critical: string; high: string; aiScore: string; fixTime: string };
  categories: string;
  issuesFound: (n: number) => string;
  howToFix: string;
  expectedGain: string;
  evidence: string;
  aiTitle: string;
  aiUnavailable: string;
  mainProblems: string;
  priorities: string;
  impacts: string;
  gains: string;
  actionPlan: string;
  technicalNotes: string;
  auditOf: (host: string) => string;
  pageOf: (page: string, total: string) => string;
  score: { excellent: string; good: string; fair: string; poor: string };
  severity: Record<'critical' | 'high' | 'medium' | 'low' | 'info', string>;
  priority: Record<'alta' | 'media' | 'baixa', string>;
  minutes: string;
  hours: string;
  days: string;
  /** Locale para formatar a data no cabeçalho. */
  locale: string;
}

export const PDF_TEXTS: Record<Lang, PdfTexts> = {
  pt: {
    kicker: 'Relatório de auditoria web',
    analyzedAt: 'Analisado em',
    stats: { issues: 'Problemas', critical: 'Críticos', high: 'Altos', aiScore: 'IA Score', fixTime: 'de correção' },
    categories: 'Notas por categoria',
    issuesFound: (n) => `Problemas encontrados (${n})`,
    howToFix: 'Como corrigir',
    expectedGain: 'Ganho esperado',
    evidence: 'Evidências',
    aiTitle: 'Análise por IA',
    aiUnavailable: 'Análise por IA indisponível nesta auditoria.',
    mainProblems: 'Principais problemas',
    priorities: 'Ordem de prioridade',
    impacts: 'Impacto no negócio',
    gains: 'Ganhos estimados',
    actionPlan: 'Plano de ação',
    technicalNotes: 'Notas técnicas',
    auditOf: (host) => `FAST · Auditoria de ${host}`,
    pageOf: (page, total) => `Página ${page} de ${total}`,
    score: { excellent: 'Excelente', good: 'Bom', fair: 'Precisa melhorar', poor: 'Crítico' },
    severity: { critical: 'Crítico', high: 'Alto', medium: 'Médio', low: 'Baixo', info: 'Info' },
    priority: { alta: 'Prioridade alta', media: 'Prioridade média', baixa: 'Prioridade baixa' },
    minutes: 'min',
    hours: 'h',
    days: 'dia(s)',
    locale: 'pt-BR',
  },

  en: {
    kicker: 'Web audit report',
    analyzedAt: 'Analysed on',
    stats: { issues: 'Problems', critical: 'Critical', high: 'High', aiScore: 'AI Score', fixTime: 'to fix' },
    categories: 'Scores by category',
    issuesFound: (n) => `Problems found (${n})`,
    howToFix: 'How to fix',
    expectedGain: 'Expected gain',
    evidence: 'Evidence',
    aiTitle: 'AI analysis',
    aiUnavailable: 'AI analysis unavailable for this audit.',
    mainProblems: 'Main problems',
    priorities: 'Priority order',
    impacts: 'Business impact',
    gains: 'Estimated gains',
    actionPlan: 'Action plan',
    technicalNotes: 'Technical notes',
    auditOf: (host) => `FAST · Audit of ${host}`,
    pageOf: (page, total) => `Page ${page} of ${total}`,
    score: { excellent: 'Excellent', good: 'Good', fair: 'Needs work', poor: 'Critical' },
    severity: { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low', info: 'Info' },
    priority: { alta: 'High priority', media: 'Medium priority', baixa: 'Low priority' },
    minutes: 'min',
    hours: 'h',
    days: 'day(s)',
    locale: 'en-GB',
  },

  es: {
    kicker: 'Informe de auditoría web',
    analyzedAt: 'Analizado el',
    stats: { issues: 'Problemas', critical: 'Críticos', high: 'Altos', aiScore: 'IA Score', fixTime: 'de corrección' },
    categories: 'Notas por categoría',
    issuesFound: (n) => `Problemas encontrados (${n})`,
    howToFix: 'Cómo corregir',
    expectedGain: 'Beneficio esperado',
    evidence: 'Evidencias',
    aiTitle: 'Análisis por IA',
    aiUnavailable: 'Análisis por IA no disponible en esta auditoría.',
    mainProblems: 'Principales problemas',
    priorities: 'Orden de prioridad',
    impacts: 'Impacto en el negocio',
    gains: 'Beneficios estimados',
    actionPlan: 'Plan de acción',
    technicalNotes: 'Notas técnicas',
    auditOf: (host) => `FAST · Auditoría de ${host}`,
    pageOf: (page, total) => `Página ${page} de ${total}`,
    score: { excellent: 'Excelente', good: 'Bueno', fair: 'Necesita mejorar', poor: 'Crítico' },
    severity: { critical: 'Crítico', high: 'Alto', medium: 'Medio', low: 'Bajo', info: 'Info' },
    priority: { alta: 'Prioridad alta', media: 'Prioridad media', baixa: 'Prioridad baja' },
    minutes: 'min',
    hours: 'h',
    days: 'día(s)',
    locale: 'es-ES',
  },

  zh: {
    kicker: '网站审计报告',
    analyzedAt: '分析于',
    stats: { issues: '问题', critical: '严重', high: '高危', aiScore: 'AI 得分', fixTime: '修复用时' },
    categories: '各类别评分',
    issuesFound: (n) => `发现的问题（${n}）`,
    howToFix: '如何修复',
    expectedGain: '预期收益',
    evidence: '证据',
    aiTitle: 'AI 分析',
    aiUnavailable: '本次审计没有生成 AI 分析。',
    mainProblems: '主要问题',
    priorities: '优先级顺序',
    impacts: '对业务的影响',
    gains: '预期收益',
    actionPlan: '行动计划',
    technicalNotes: '技术备注',
    auditOf: (host) => `FAST · ${host} 的审计`,
    pageOf: (page, total) => `第 ${page} 页，共 ${total} 页`,
    score: { excellent: '优秀', good: '良好', fair: '有待改进', poor: '严重' },
    severity: { critical: '严重', high: '高', medium: '中', low: '低', info: '提示' },
    priority: { alta: '高优先级', media: '中优先级', baixa: '低优先级' },
    minutes: '分钟',
    hours: '小时',
    days: '天',
    locale: 'zh-CN',
  },
};
