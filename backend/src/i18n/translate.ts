import type { AuditReport, Check, Issue, PluginResult } from '../core/types.js';
import { VALUE_PATTERNS } from './catalog/patterns.js';
import { pt } from './catalog/pt.js';
import { SENTENCE_PATTERNS } from './catalog/sentences.js';
import { UI } from './catalog/ui.js';
import { applyPatterns, retemplate } from './template.js';
import type { IssueText, Lang, LangCatalog } from './types.js';

/**
 * Tradução do relatório.
 *
 * Os plugins continuam escrevendo em português — é a língua do código, e
 * duplicar cada texto em quatro idiomas dentro da lógica de auditoria tornaria
 * qualquer ajuste de regra um trabalho de revisão em quatro frentes. A tradução
 * acontece uma única vez, aqui, no fim da auditoria: cada texto é localizado
 * pelo id da verificação ou do problema, e os textos com números são recolocados
 * a partir do molde do idioma de destino.
 *
 * Quando um id não está no catálogo, o texto original permanece. Traduzir pela
 * metade é preferível a esconder um problema encontrado.
 */

type CatalogLoader = () => Promise<LangCatalog>;

const LOADERS: Record<Exclude<Lang, 'pt'>, CatalogLoader> = {
  en: async () => (await import('./catalog/en/index.js')).en,
  es: async () => (await import('./catalog/es/index.js')).es,
  zh: async () => (await import('./catalog/zh/index.js')).zh,
};

const cache = new Map<Lang, LangCatalog>();

/** Carrega (uma vez por processo) o catálogo de um idioma. */
export async function getCatalog(lang: Lang): Promise<LangCatalog> {
  if (lang === 'pt') return pt;
  const cached = cache.get(lang);
  if (cached) return cached;

  const catalog = await LOADERS[lang]();
  cache.set(lang, catalog);
  return catalog;
}

/**
 * Traduz um texto identificado por id, respeitando os marcadores numéricos.
 *
 * Quando o id não resolve — problemas cujo texto muda conforme o caso dividem
 * o mesmo id — cai na tabela de frases, que casa pelo próprio texto.
 */
function byId(
  source: string | undefined,
  target: string | undefined,
  actual: string,
  lang: Lang,
): string {
  if (source && target) {
    const translated = retemplate(source, target, actual);
    if (translated !== null) return translated;
  }
  if (!source && target) return target;
  return applyPatterns(SENTENCE_PATTERNS, lang, actual);
}

function translateCheck(check: Check, pluginId: string, catalog: LangCatalog, lang: Lang): Check {
  return {
    ...check,
    label: byId(
      pt.checks[pluginId]?.[check.id],
      catalog.checks[pluginId]?.[check.id],
      check.label,
      lang,
    ),
    value: check.value === undefined ? undefined : applyPatterns(VALUE_PATTERNS, lang, check.value),
  };
}

function translateIssue(issue: Issue, catalog: LangCatalog, lang: Lang): Issue {
  // O problema carrega a categoria, não o plugin — e o id do plugin coincide
  // com o da categoria em todos os módulos registrados.
  const source: IssueText | undefined = pt.issues[issue.category]?.[issue.id];
  const target: IssueText | undefined = catalog.issues[issue.category]?.[issue.id];

  return {
    ...issue,
    title: byId(source?.title, target?.title, issue.title, lang),
    description: byId(source?.description, target?.description, issue.description, lang),
    howToFix: byId(source?.fix, target?.fix, issue.howToFix, lang),
    expectedGain: byId(source?.gain, target?.gain, issue.expectedGain, lang),
    evidence: issue.evidence?.map((item) => applyPatterns(VALUE_PATTERNS, lang, item)),
  };
}

function translatePlugin(plugin: PluginResult, catalog: LangCatalog, lang: Lang): PluginResult {
  const identity = catalog.plugins[plugin.id];
  return {
    ...plugin,
    name: identity?.name ?? plugin.name,
    description: identity?.description ?? plugin.description,
    checks: plugin.checks.map((check) => translateCheck(check, plugin.id, catalog, lang)),
    issues: plugin.issues.map((issue) => translateIssue(issue, catalog, lang)),
    recommendations: plugin.recommendations.map((item) => applyPatterns(VALUE_PATTERNS, lang, item)),
  };
}

/** Devolve uma cópia do relatório com todo o texto no idioma pedido. */
export async function translateReport(report: AuditReport, lang: Lang): Promise<AuditReport> {
  if (lang === 'pt') return report;

  const catalog = await getCatalog(lang);
  const ui = UI[lang];

  const issues = report.issues.map((issue) => translateIssue(issue, catalog, lang));
  const titleById = new Map(issues.map((issue) => [issue.id, issue.title]));

  return {
    ...report,
    categories: report.categories.map((category) => ({
      ...category,
      label: ui.categories[category.category] ?? category.label,
    })),
    plugins: report.plugins.map((plugin) => translatePlugin(plugin, catalog, lang)),
    issues,
    checklist: report.checklist.map((item) => ({
      ...item,
      title: titleById.get(item.id) ?? item.title,
    })),
  };
}

/** Traduz uma mensagem de progresso emitida durante a auditoria. */
export function translateProgress(message: string, lang: Lang): string {
  if (lang === 'pt') return message;
  const ui = UI[lang];

  const direct = ui.progress[message];
  if (direct) return direct;

  // "<módulo> concluído." e "<módulo> falhou." — o nome do módulo é traduzido
  // à parte, no motor, antes de chegar aqui.
  const done = retemplate(UI.pt.moduleDone, ui.moduleDone, message);
  if (done !== null) return done;

  const failed = retemplate(UI.pt.moduleFailed, ui.moduleFailed, message);
  if (failed !== null) return failed;

  return message;
}
