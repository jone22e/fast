import type { CategoryId } from '../core/types.js';

/** Idiomas atendidos pela plataforma. */
export type Lang = 'pt' | 'en' | 'es' | 'zh';

export const LANGS: readonly Lang[] = ['pt', 'en', 'es', 'zh'] as const;

export const DEFAULT_LANG: Lang = 'pt';

/** Textos de um problema, na ordem em que aparecem no relatório. */
export interface IssueText {
  title?: string;
  description?: string;
  fix?: string;
  gain?: string;
}

/**
 * Catálogo de um idioma para o corpo do relatório.
 *
 * As chaves são sempre ids — nunca o texto em si — para que a tradução não se
 * perca quando o texto original mudar. Textos com números guardam marcadores
 * posicionais ({0}, {1}…) na mesma ordem do original em pt-BR.
 */
export interface LangCatalog {
  plugins: Record<string, { name: string; description: string }>;
  checks: Record<string, Record<string, string>>;
  issues: Record<string, Record<string, IssueText>>;
}

/** O catálogo de um módulo em um idioma — a forma como as traduções são escritas. */
export interface PluginCatalog {
  name: string;
  description: string;
  checks: Record<string, string>;
  issues: Record<string, IssueText>;
}

/** Reúne os catálogos por módulo na forma achatada que o tradutor consome. */
export function fromPlugins(modules: Record<string, PluginCatalog>): LangCatalog {
  const catalog: LangCatalog = { plugins: {}, checks: {}, issues: {} };
  for (const [id, module] of Object.entries(modules)) {
    catalog.plugins[id] = { name: module.name, description: module.description };
    catalog.checks[id] = module.checks;
    catalog.issues[id] = module.issues;
  }
  return catalog;
}

/** Textos que não vêm dos plugins: categorias, progresso e avisos. */
export interface UiCatalog {
  categories: Record<CategoryId, string>;
  /** Mensagens de progresso, indexadas pela mensagem original em pt-BR. */
  progress: Record<string, string>;
  /** Sufixos dinâmicos do progresso: "{0} concluído." e "{0} falhou." */
  moduleDone: string;
  moduleFailed: string;
  /** Avisos do módulo de IA. */
  aiUnavailable: string;
  aiFailed: string;
}

/** Uma linha da tabela de padrões: o original e as três traduções. */
export interface Pattern {
  pt: string;
  en: string;
  es: string;
  zh: string;
}
