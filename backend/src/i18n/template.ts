import type { Lang, Pattern } from './types.js';

/**
 * Casamento de textos com números.
 *
 * Os plugins montam frases como `3 link(s) quebrado(s) em 25 verificados`.
 * O catálogo guarda o molde em pt-BR (`{0} link(s) quebrado(s) em {1}
 * verificados`) e o molde traduzido. Traduzir é, então, casar o texto pronto
 * contra o molde original, extrair os valores e recolocá-los no molde do outro
 * idioma — na posição que aquele idioma exigir.
 */

const PLACEHOLDER = /\{(\d+)\}/g;

const regexCache = new Map<string, RegExp | null>();

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Constrói (e memoriza) a expressão que casa com um molde em pt-BR. */
function matcher(template: string): RegExp | null {
  if (regexCache.has(template)) return regexCache.get(template) ?? null;

  let regex: RegExp | null = null;
  if (PLACEHOLDER.test(template)) {
    PLACEHOLDER.lastIndex = 0;
    // Escapa tudo e devolve os marcadores como grupos não gulosos.
    const body = escape(template).replace(/\\\{(\d+)\\\}/g, '(.*?)');
    regex = new RegExp(`^${body}$`, 's');
  }
  PLACEHOLDER.lastIndex = 0;

  regexCache.set(template, regex);
  return regex;
}

/** Verdadeiro quando o molde tem marcadores posicionais. */
export function isTemplate(template: string): boolean {
  const has = PLACEHOLDER.test(template);
  PLACEHOLDER.lastIndex = 0;
  return has;
}

/**
 * Traduz `actual` do molde `from` para o molde `to`.
 *
 * Devolve `null` quando o texto não corresponde ao molde original — sinal de
 * que o catálogo está defasado em relação ao plugin. Nesse caso quem chama
 * mantém o texto como está: um trecho em português é melhor do que um trecho
 * com números embaralhados.
 */
export function retemplate(from: string, to: string, actual: string): string | null {
  if (!isTemplate(from)) return actual === from ? to : null;

  const regex = matcher(from);
  if (!regex) return null;

  const found = regex.exec(actual);
  if (!found) return null;

  return to.replace(PLACEHOLDER, (_, index: string) => found[Number(index) + 1] ?? '');
}

/**
 * Aplica a primeira linha da tabela que casar com o texto.
 *
 * Usada nos valores medidos, nas evidências e nas recomendações — textos que
 * não têm id próprio e por isso são identificados pelo formato.
 */
export function applyPatterns(patterns: Pattern[], lang: Lang, actual: string): string {
  if (lang === 'pt') return actual;

  for (const pattern of patterns) {
    const translated = retemplate(pattern.pt, pattern[lang], actual);
    if (translated !== null) return translated;
  }
  return actual;
}
