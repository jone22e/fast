import { computed, ref } from 'vue';
import { en } from './en';
import { es } from './es';
import type { Messages } from './messages';
import { pt } from './pt';
import { zh } from './zh';

/**
 * Idioma da interface.
 *
 * Estado global e reativo em um módulo, sem dependência externa: são quatro
 * idiomas e um punhado de telas. A escolha é lembrada no navegador e enviada
 * ao backend, que responde com o relatório e a análise da IA no mesmo idioma.
 */

export type Lang = 'pt' | 'en' | 'es' | 'zh';

export const LANGS: Lang[] = ['pt', 'en', 'es', 'zh'];

const CATALOGS: Record<Lang, Messages> = { pt, en, es, zh };

const STORAGE_KEY = 'fast:lang';

function isLang(value: string): value is Lang {
  return (LANGS as string[]).includes(value);
}

/** Preferência salva → idioma do navegador → português. */
function detect(): Lang {
  if (typeof window === 'undefined') return 'pt';

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && isLang(saved)) return saved;
  } catch {
    // localStorage bloqueado (modo privado): segue para a detecção.
  }

  for (const candidate of navigator.languages ?? [navigator.language]) {
    const base = candidate?.split('-')[0]?.toLowerCase() ?? '';
    if (isLang(base)) return base;
  }
  return 'pt';
}

const current = ref<Lang>(detect());

/**
 * Sincroniza o documento com o idioma: o atributo lang (leitores de tela e
 * buscadores leem daí), o título da aba e a meta description.
 *
 * O HTML servido continua em português — é o que o rastreador vê na primeira
 * visita. Aqui ajustamos o que o visitante vê depois de escolher.
 */
function syncDocument(lang: Lang): void {
  if (typeof document === 'undefined') return;

  const messages = CATALOGS[lang];
  document.documentElement.lang = messages.htmlLang;
  document.title = messages.meta.title;

  const description = document.querySelector('meta[name="description"]');
  description?.setAttribute('content', messages.meta.description);
}

syncDocument(current.value);

export function setLang(lang: Lang): void {
  if (!isLang(lang) || lang === current.value) return;
  current.value = lang;
  syncDocument(lang);
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Sem persistência: a escolha vale só para esta sessão.
  }
}

export function useI18n() {
  return {
    lang: computed(() => current.value),
    /** Textos do idioma atual. */
    t: computed(() => CATALOGS[current.value]),
    langName: (lang: Lang) => CATALOGS[lang].langName,
    setLang,
    langs: LANGS,
  };
}
