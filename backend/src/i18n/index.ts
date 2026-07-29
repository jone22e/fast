import { UI } from './catalog/ui.js';
import { DEFAULT_LANG, LANGS } from './types.js';
import type { Lang } from './types.js';

export { DEFAULT_LANG, LANGS } from './types.js';
export type { Lang } from './types.js';
export { UI } from './catalog/ui.js';
export { getCatalog, translateProgress, translateReport } from './translate.js';

/**
 * Resolve o idioma pedido.
 *
 * Aceita tanto o código puro (`en`) quanto a forma regional (`pt-BR`, `zh-Hans`,
 * `es-419`) e o cabeçalho Accept-Language inteiro, na ordem de preferência
 * declarada pelo cliente. Qualquer coisa fora dos quatro idiomas atendidos cai
 * no padrão em português.
 */
export function normalizeLang(raw: string | null | undefined): Lang {
  if (!raw) return DEFAULT_LANG;

  const candidates = raw
    .split(',')
    .map((part) => part.split(';')[0]?.trim().toLowerCase() ?? '')
    .filter(Boolean);

  for (const candidate of candidates) {
    const base = candidate.split('-')[0] as Lang;
    if (LANGS.includes(base)) return base;
  }

  return DEFAULT_LANG;
}

/** Nome do idioma na própria língua — usado no prompt da IA e nos seletores. */
export const LANG_NAMES: Record<Lang, string> = {
  pt: 'português do Brasil',
  en: 'English',
  es: 'español',
  zh: '简体中文',
};

/** Rótulo de categoria já traduzido, para uso fora do relatório. */
export function categoryLabel(category: keyof (typeof UI)['pt']['categories'], lang: Lang): string {
  return UI[lang].categories[category];
}
