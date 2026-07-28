import type { Page } from 'playwright';
import type { DomSnapshot } from './types.js';

/**
 * Extrai tudo que os plugins precisam do DOM renderizado em uma única
 * passagem dentro do navegador. Evita dezenas de round-trips CDP.
 */
export async function extractDom(page: Page, origin: string): Promise<DomSnapshot> {
  return page.evaluate((pageOrigin: string): DomSnapshot => {
    const doc = document;

    const sel = (el: Element): string => {
      if (el.id) return `#${el.id}`;
      const cls = (el.className && typeof el.className === 'string' ? el.className : '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .join('.');
      return cls ? `${el.tagName.toLowerCase()}.${cls}` : el.tagName.toLowerCase();
    };

    const attr = (q: string, name: string): string | null =>
      doc.querySelector(q)?.getAttribute(name)?.trim() ?? null;

    // ---- Meta básico ------------------------------------------------------
    const title = doc.querySelector('title')?.textContent?.trim() ?? null;
    const metaDescription = attr('meta[name="description" i]', 'content');
    const canonical = attr('link[rel="canonical" i]', 'href');
    const robotsMeta = attr('meta[name="robots" i]', 'content');
    const viewport = attr('meta[name="viewport" i]', 'content');
    const charset =
      doc.characterSet ||
      doc.querySelector('meta[charset]')?.getAttribute('charset') ||
      null;
    const lang = doc.documentElement.getAttribute('lang');

    // ---- Headings ---------------------------------------------------------
    const headings = Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((h) => ({
      level: Number(h.tagName[1]),
      text: (h.textContent ?? '').trim().slice(0, 200),
    }));

    // ---- Links ------------------------------------------------------------
    const links = Array.from(doc.querySelectorAll('a[href]'))
      .map((a) => {
        const href = a.getAttribute('href') ?? '';
        let absolute = '';
        try {
          absolute = new URL(href, doc.baseURI).toString();
        } catch {
          absolute = '';
        }
        let internal = false;
        try {
          internal = absolute ? new URL(absolute).origin === pageOrigin : false;
        } catch {
          internal = false;
        }
        return {
          href,
          absolute,
          text: (a.textContent ?? '').trim().slice(0, 120),
          internal,
          rel: a.getAttribute('rel'),
          target: a.getAttribute('target'),
        };
      })
      .filter((l) => l.absolute && !l.absolute.startsWith('javascript:'));

    // ---- Imagens ----------------------------------------------------------
    const images = Array.from(doc.querySelectorAll('img')).map((img) => {
      const rect = img.getBoundingClientRect();
      const src = img.currentSrc || img.src || img.getAttribute('src') || '';
      const ext = src.split('?')[0].split('.').pop()?.toLowerCase() ?? null;
      return {
        src,
        alt: img.getAttribute('alt'),
        width: img.getAttribute('width') ? Number(img.getAttribute('width')) : null,
        height: img.getAttribute('height') ? Number(img.getAttribute('height')) : null,
        loading: img.getAttribute('loading'),
        naturalWidth: img.naturalWidth || null,
        naturalHeight: img.naturalHeight || null,
        displayWidth: Math.round(rect.width) || null,
        displayHeight: Math.round(rect.height) || null,
        hasSrcset: Boolean(img.getAttribute('srcset') || img.closest('picture')?.querySelector('source')),
        transferSize: null,
        format: ext && ext.length <= 5 ? ext : null,
      };
    });

    // ---- Open Graph / Twitter --------------------------------------------
    const openGraph: Record<string, string> = {};
    doc.querySelectorAll('meta[property^="og:" i]').forEach((m) => {
      const p = m.getAttribute('property')?.toLowerCase();
      const c = m.getAttribute('content');
      if (p && c) openGraph[p] = c;
    });

    const twitter: Record<string, string> = {};
    doc.querySelectorAll('meta[name^="twitter:" i]').forEach((m) => {
      const n = m.getAttribute('name')?.toLowerCase();
      const c = m.getAttribute('content');
      if (n && c) twitter[n] = c;
    });

    // ---- Dados estruturados ----------------------------------------------
    const jsonLd: unknown[] = [];
    doc.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
      try {
        jsonLd.push(JSON.parse(s.textContent ?? ''));
      } catch {
        jsonLd.push({ __parseError: true, raw: (s.textContent ?? '').slice(0, 200) });
      }
    });

    const microdataTypes = Array.from(doc.querySelectorAll('[itemtype]'))
      .map((el) => el.getAttribute('itemtype') ?? '')
      .filter(Boolean);

    // ---- Tags semânticas --------------------------------------------------
    const semanticNames = [
      'article', 'main', 'nav', 'section', 'aside', 'figure', 'figcaption',
      'header', 'footer', 'time', 'address', 'details', 'summary', 'mark',
    ];
    const semanticTags: Record<string, number> = {};
    for (const name of semanticNames) {
      semanticTags[name] = doc.querySelectorAll(name).length;
    }

    // ---- Conteúdo ---------------------------------------------------------
    const main = doc.querySelector<HTMLElement>('main, article, [role="main"]') ?? doc.body;
    const rawText = (main?.innerText ?? doc.body?.innerText ?? '').replace(/\s+/g, ' ').trim();
    const wordCount = rawText ? rawText.split(/\s+/).length : 0;

    const faqBlocks =
      doc.querySelectorAll('details, [itemtype*="FAQPage" i], .faq, #faq, [class*="accordion" i]').length;

    // ---- Autoria ----------------------------------------------------------
    const author =
      attr('meta[name="author" i]', 'content') ??
      attr('[rel="author"]', 'href') ??
      doc.querySelector('[itemprop="author"], .author, .byline')?.textContent?.trim().slice(0, 120) ??
      null;

    const publishedTime =
      attr('meta[property="article:published_time" i]', 'content') ??
      attr('[itemprop="datePublished"]', 'content') ??
      doc.querySelector('time[datetime]')?.getAttribute('datetime') ??
      null;

    const modifiedTime =
      attr('meta[property="article:modified_time" i]', 'content') ??
      attr('[itemprop="dateModified"]', 'content') ??
      null;

    const timeElements = Array.from(doc.querySelectorAll('time'))
      .map((t) => t.getAttribute('datetime') ?? t.textContent?.trim() ?? '')
      .filter(Boolean)
      .slice(0, 20);

    // ---- Acessibilidade ---------------------------------------------------
    const imagesWithoutAlt = Array.from(doc.querySelectorAll('img')).filter(
      (img) => img.getAttribute('alt') === null,
    ).length;

    const inputsWithoutLabel = Array.from(
      doc.querySelectorAll<HTMLInputElement>('input, select, textarea'),
    )
      .filter((el) => {
        const type = (el.getAttribute('type') ?? '').toLowerCase();
        if (type === 'hidden' || type === 'submit' || type === 'button' || type === 'image') return false;
        if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return false;
        if (el.getAttribute('title')) return false;
        if (el.id && doc.querySelector(`label[for="${CSS.escape(el.id)}"]`)) return false;
        if (el.closest('label')) return false;
        return true;
      })
      .map((el) => ({ selector: sel(el), type: el.getAttribute('type') ?? el.tagName.toLowerCase() }))
      .slice(0, 30);

    const ariaLabels = doc.querySelectorAll('[aria-label],[aria-labelledby],[role]').length;

    const positiveTabIndex = Array.from(doc.querySelectorAll('[tabindex]'))
      .map((el) => ({ selector: sel(el), tabIndex: Number(el.getAttribute('tabindex')) }))
      .filter((t) => Number.isFinite(t.tabIndex) && t.tabIndex > 0)
      .slice(0, 20);

    const focusableCount = doc.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ).length;

    const landmarks: Record<string, number> = {
      banner: doc.querySelectorAll('header, [role="banner"]').length,
      navigation: doc.querySelectorAll('nav, [role="navigation"]').length,
      main: doc.querySelectorAll('main, [role="main"]').length,
      contentinfo: doc.querySelectorAll('footer, [role="contentinfo"]').length,
      search: doc.querySelectorAll('[role="search"]').length,
    };

    // ---- Contraste --------------------------------------------------------
    const parseColor = (value: string): [number, number, number, number] | null => {
      const m = value.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const parts = m[1].split(',').map((p) => Number.parseFloat(p.trim()));
      if (parts.length < 3 || parts.some((p) => !Number.isFinite(p))) return null;
      return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
    };

    const luminance = (r: number, g: number, b: number): number => {
      const chan = (c: number) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
    };

    const effectiveBackground = (el: Element): [number, number, number] => {
      let node: Element | null = el;
      while (node) {
        const bg = parseColor(getComputedStyle(node).backgroundColor);
        if (bg && bg[3] > 0.1) return [bg[0], bg[1], bg[2]];
        node = node.parentElement;
      }
      return [255, 255, 255];
    };

    const contrastIssues: { selector: string; ratio: number; text: string }[] = [];
    const textNodes = Array.from(
      doc.querySelectorAll('p, span, a, li, h1, h2, h3, h4, h5, h6, button, label, td, th'),
    ).slice(0, 400);

    for (const el of textNodes) {
      const text = (el.textContent ?? '').trim();
      if (!text || text.length < 3) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) < 0.1) continue;

      const fg = parseColor(style.color);
      if (!fg) continue;
      const bg = effectiveBackground(el);

      const l1 = luminance(fg[0], fg[1], fg[2]);
      const l2 = luminance(bg[0], bg[1], bg[2]);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

      const fontSize = Number.parseFloat(style.fontSize);
      const bold = Number(style.fontWeight) >= 700;
      const large = fontSize >= 24 || (fontSize >= 18.66 && bold);
      const required = large ? 3 : 4.5;

      if (ratio < required) {
        contrastIssues.push({
          selector: sel(el),
          ratio: Math.round(ratio * 100) / 100,
          text: text.slice(0, 60),
        });
      }
      if (contrastIssues.length >= 25) break;
    }

    // ---- UX ---------------------------------------------------------------
    const buttons = doc.querySelectorAll('button, [role="button"], input[type="submit"]').length;

    const forms = Array.from(doc.querySelectorAll('form')).map((f) => ({
      action: f.getAttribute('action'),
      method: (f.getAttribute('method') || 'get').toLowerCase(),
      fields: f.querySelectorAll('input:not([type="hidden"]), select, textarea').length,
      hasSubmit: Boolean(f.querySelector('button, input[type="submit"]')),
      hasPassword: Boolean(f.querySelector('input[type="password" i]')),
    }));

    const ctaCandidates = Array.from(
      doc.querySelectorAll('a.btn, a.button, button, [class*="cta" i], a[class*="btn" i]'),
    )
      .map((el) => (el.textContent ?? '').trim())
      .filter((t) => t.length > 0 && t.length < 60)
      .slice(0, 20);

    const fontFamilies = Array.from(
      new Set(
        Array.from(doc.querySelectorAll('body, h1, h2, h3, p, a, button, li'))
          .map((el) => getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim())
          .filter(Boolean),
      ),
    ).slice(0, 15);

    const colorCount = new Set(
      Array.from(doc.querySelectorAll('*'))
        .slice(0, 800)
        .map((el) => getComputedStyle(el).color),
    ).size;

    // ---- Recursos no head -------------------------------------------------
    const linksOf = (rel: string): string[] =>
      Array.from(doc.querySelectorAll(`link[rel="${rel}" i]`))
        .map((l) => l.getAttribute('href') ?? '')
        .filter(Boolean);

    const renderBlockingCss = Array.from(
      doc.querySelectorAll('head link[rel="stylesheet"]'),
    ).filter((l) => {
      const media = l.getAttribute('media');
      return !media || media === 'all' || media === 'screen';
    }).length;

    const renderBlockingJs = Array.from(doc.querySelectorAll('head script[src]')).filter(
      (s) => !s.hasAttribute('async') && !s.hasAttribute('defer') && s.getAttribute('type') !== 'module',
    ).length;

    const inlineStyleBytes = Array.from(doc.querySelectorAll('style')).reduce(
      (n, s) => n + (s.textContent?.length ?? 0),
      0,
    );
    const inlineScriptBytes = Array.from(doc.querySelectorAll('script:not([src])')).reduce(
      (n, s) => n + (s.textContent?.length ?? 0),
      0,
    );

    return {
      title,
      metaDescription,
      canonical,
      robotsMeta,
      viewport,
      charset,
      lang,
      headings,
      links,
      images,
      openGraph,
      twitter,
      jsonLd,
      microdataTypes,
      semanticTags,
      text: rawText.slice(0, 40_000),
      wordCount,
      lists: doc.querySelectorAll('ul, ol').length,
      tables: doc.querySelectorAll('table').length,
      codeBlocks: doc.querySelectorAll('pre, code').length,
      definitionLists: doc.querySelectorAll('dl').length,
      faqBlocks,
      author,
      publishedTime,
      modifiedTime,
      timeElements,
      imagesWithoutAlt,
      inputsWithoutLabel,
      ariaLabels,
      positiveTabIndex,
      contrastIssues,
      focusableCount,
      landmarks,
      buttons,
      forms,
      navElements: doc.querySelectorAll('nav').length,
      ctaCandidates,
      fontFamilies,
      colorCount,
      preloads: linksOf('preload'),
      prefetches: linksOf('prefetch'),
      preconnects: [...linksOf('preconnect'), ...linksOf('dns-prefetch')],
      renderBlockingCss,
      renderBlockingJs,
      inlineStyleBytes,
      inlineScriptBytes,
    };
  }, origin);
}

/** Mede overflow horizontal, alvos de toque e fontes pequenas no viewport atual. */
export async function measureViewport(page: Page): Promise<{
  horizontalOverflow: boolean;
  overflowingSelectors: string[];
  smallTapTargets: { selector: string; width: number; height: number }[];
  smallFonts: { selector: string; fontSize: number }[];
}> {
  return page.evaluate(() => {
    const sel = (el: Element): string => {
      if (el.id) return `#${el.id}`;
      const cls = (el.className && typeof el.className === 'string' ? el.className : '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .join('.');
      return cls ? `${el.tagName.toLowerCase()}.${cls}` : el.tagName.toLowerCase();
    };

    const vw = document.documentElement.clientWidth;
    const overflowingSelectors: string[] = [];

    for (const el of Array.from(document.querySelectorAll('body *')).slice(0, 1500)) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0) continue;
      if (rect.right > vw + 2 || rect.left < -2) {
        const style = getComputedStyle(el);
        if (style.position === 'fixed' || style.visibility === 'hidden') continue;
        overflowingSelectors.push(sel(el));
        if (overflowingSelectors.length >= 15) break;
      }
    }

    const smallTapTargets: { selector: string; width: number; height: number }[] = [];
    for (const el of Array.from(
      document.querySelectorAll('a[href], button, input, select, [role="button"]'),
    ).slice(0, 300)) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.width < 44 || rect.height < 44) {
        smallTapTargets.push({
          selector: sel(el),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
        if (smallTapTargets.length >= 20) break;
      }
    }

    const smallFonts: { selector: string; fontSize: number }[] = [];
    for (const el of Array.from(document.querySelectorAll('p, span, li, td, a')).slice(0, 300)) {
      const text = (el.textContent ?? '').trim();
      if (text.length < 5) continue;
      const size = Number.parseFloat(getComputedStyle(el).fontSize);
      if (Number.isFinite(size) && size < 12) {
        smallFonts.push({ selector: sel(el), fontSize: Math.round(size * 10) / 10 });
        if (smallFonts.length >= 20) break;
      }
    }

    return {
      horizontalOverflow: document.documentElement.scrollWidth > vw + 2,
      overflowingSelectors,
      smallTapTargets,
      smallFonts,
    };
  });
}

/** Coleta Core Web Vitals via PerformanceObserver já instalado no init script. */
export async function collectMetrics(page: Page): Promise<Record<string, number | null>> {
  return page.evaluate(() => {
    const w = window as unknown as { __fastVitals?: Record<string, number>; __fastLongTasks?: number };
    const vitals = w.__fastVitals ?? {};
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const paints = performance.getEntriesByType('paint');
    const fcpEntry = paints.find((p) => p.name === 'first-contentful-paint');

    return {
      lcp: vitals.lcp ?? null,
      cls: vitals.cls ?? 0,
      inp: vitals.inp ?? null,
      fcp: fcpEntry ? Math.round(fcpEntry.startTime) : null,
      ttfb: nav ? Math.round(nav.responseStart - nav.requestStart) : null,
      tbt: vitals.tbt ?? 0,
      domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
      load: nav ? Math.round(nav.loadEventEnd) : null,
      domNodes: document.querySelectorAll('*').length,
      longTasks: w.__fastLongTasks ?? 0,
    };
  });
}

/** Script injetado antes do carregamento para observar Web Vitals. */
export const VITALS_INIT_SCRIPT = `
(() => {
  const w = window;
  w.__fastVitals = { cls: 0, tbt: 0 };
  w.__fastLongTasks = 0;

  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) w.__fastVitals.lcp = Math.round(last.startTime);
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {}

  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          w.__fastVitals.cls = Math.round(((w.__fastVitals.cls || 0) + entry.value) * 10000) / 10000;
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch {}

  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        w.__fastLongTasks++;
        const blocking = entry.duration - 50;
        if (blocking > 0) w.__fastVitals.tbt = Math.round((w.__fastVitals.tbt || 0) + blocking);
      }
    }).observe({ type: 'longtask', buffered: true });
  } catch {}

  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const d = Math.round(entry.duration);
        if (!w.__fastVitals.inp || d > w.__fastVitals.inp) w.__fastVitals.inp = d;
      }
    }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
  } catch {}
})();
`;
