import tls from 'node:tls';
import dns from 'node:dns/promises';
import { URL } from 'node:url';
import type { BrowserContext, Page, Response as PWResponse } from 'playwright';
import { config } from '../config.js';
import { getBrowser, MOBILE_USER_AGENT, USER_AGENT } from './browser.js';
import { VITALS_INIT_SCRIPT, collectMetrics, extractDom, measureViewport } from './extract.js';
import type {
  AuditContext,
  CookieInfo,
  FetchedText,
  NetworkInfo,
  NetworkResource,
  PerformanceMetrics,
  RedirectHop,
  SitemapInfo,
  ViewportSnapshot,
} from './types.js';

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

/** Detecta CDN a partir de cabeçalhos de resposta. */
function detectCdn(headers: Record<string, string>): string | null {
  const map: [string, string][] = [
    ['cf-ray', 'Cloudflare'],
    ['x-amz-cf-id', 'Amazon CloudFront'],
    ['x-vercel-id', 'Vercel'],
    ['x-nf-request-id', 'Netlify'],
    ['x-fastly-request-id', 'Fastly'],
    ['x-akamai-transformed', 'Akamai'],
    ['x-sucuri-id', 'Sucuri'],
    ['x-cache-hits', 'CDN genérico'],
  ];
  for (const [header, name] of map) {
    if (headers[header]) return name;
  }
  const server = headers['server']?.toLowerCase() ?? '';
  if (server.includes('cloudflare')) return 'Cloudflare';
  if (server.includes('cloudfront')) return 'Amazon CloudFront';
  if (headers['via']?.toLowerCase().includes('varnish')) return 'Varnish';
  return null;
}

async function fetchText(url: string, timeoutMs = 12_000): Promise<FetchedText | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'user-agent': USER_AGENT, accept: 'text/plain,text/*;q=0.9,*/*;q=0.8' },
    });
    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type');
    const charsetMatch = contentType?.match(/charset=([^;]+)/i);
    return {
      url,
      status: res.status,
      ok: res.ok,
      contentType,
      encoding: charsetMatch ? charsetMatch[1].trim().toLowerCase() : null,
      sizeBytes: buf.byteLength,
      text: buf.toString('utf8').slice(0, 300_000),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Campos do certificado podem vir como string ou lista; normaliza para string. */
function certField(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/** Inspeciona o certificado TLS e o protocolo negociado. */
async function inspectTls(hostname: string, port = 443): Promise<NetworkInfo['tls']> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      { host: hostname, port, servername: hostname, rejectUnauthorized: false, timeout: 10_000 },
      () => {
        const cert = socket.getPeerCertificate();
        const validTo = cert?.valid_to ? new Date(cert.valid_to) : null;
        const daysRemaining = validTo
          ? Math.floor((validTo.getTime() - Date.now()) / 86_400_000)
          : null;
        resolve({
          valid: socket.authorized,
          issuer: certField(cert?.issuer?.O) ?? certField(cert?.issuer?.CN),
          subject: certField(cert?.subject?.CN),
          validFrom: cert?.valid_from ?? null,
          validTo: cert?.valid_to ?? null,
          daysRemaining,
          protocol: socket.getProtocol(),
        });
        socket.end();
      },
    );
    socket.on('error', () => resolve(null));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(null);
    });
  });
}

async function inspectDns(hostname: string): Promise<{ v4: string[]; v6: string[] }> {
  const [v4, v6] = await Promise.all([
    dns.resolve4(hostname).catch(() => [] as string[]),
    dns.resolve6(hostname).catch(() => [] as string[]),
  ]);
  return { v4, v6 };
}

/** Baixa e valida sitemaps, seguindo um nível de sitemap index. */
async function collectSitemaps(origin: string, robotsTxt: string | null): Promise<SitemapInfo[]> {
  const candidates = new Set<string>([`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`]);

  if (robotsTxt) {
    for (const line of robotsTxt.split('\n')) {
      const m = line.match(/^\s*sitemap\s*:\s*(\S+)/i);
      if (m) candidates.add(m[1].trim());
    }
  }

  const results: SitemapInfo[] = [];
  const seen = new Set<string>();

  const load = async (url: string, depth: number): Promise<void> => {
    if (seen.has(url) || seen.size > 12) return;
    seen.add(url);

    const fetched = await fetchText(url);
    if (!fetched) {
      results.push({ url, status: 0, ok: false, isIndex: false, urlCount: 0, invalidUrls: [], children: [] });
      return;
    }

    const isIndex = /<sitemapindex/i.test(fetched.text);
    const locs = Array.from(fetched.text.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)).map((m) => m[1]);
    const invalidUrls: string[] = [];

    for (const loc of locs) {
      try {
        new URL(loc);
      } catch {
        if (invalidUrls.length < 10) invalidUrls.push(loc);
      }
    }

    results.push({
      url,
      status: fetched.status,
      ok: fetched.ok && locs.length > 0,
      isIndex,
      urlCount: locs.length,
      invalidUrls,
      children: isIndex ? locs.slice(0, 5) : [],
    });

    if (isIndex && depth < 1) {
      for (const child of locs.slice(0, 3)) {
        await load(child, depth + 1);
      }
    }
  };

  for (const candidate of candidates) {
    await load(candidate, 0);
  }

  return results;
}

interface NavResult {
  page: Page;
  context: BrowserContext;
  response: PWResponse | null;
  resources: NetworkResource[];
  consoleErrors: string[];
}

async function openPage(
  url: string,
  viewport: { width: number; height: number },
  mobile: boolean,
): Promise<NavResult> {
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport,
    userAgent: mobile ? MOBILE_USER_AGENT : USER_AGENT,
    isMobile: mobile,
    hasTouch: mobile,
    deviceScaleFactor: mobile ? 3 : 1,
    ignoreHTTPSErrors: true,
    serviceWorkers: 'block',
  });

  await context.addInitScript(VITALS_INIT_SCRIPT);

  const page = await context.newPage();
  const resources: NetworkResource[] = [];
  const consoleErrors: string[] = [];
  const timings = new Map<string, number>();

  page.on('request', (req) => timings.set(req.url(), Date.now()));

  page.on('response', (res) => {
    const req = res.request();
    const headers = res.headers();
    const started = timings.get(req.url()) ?? Date.now();
    const declaredSize = Number.parseInt(headers['content-length'] ?? '', 10);

    resources.push({
      url: req.url(),
      type: req.resourceType(),
      status: res.status(),
      transferSize: Number.isFinite(declaredSize) ? declaredSize : 0,
      resourceSize: Number.isFinite(declaredSize) ? declaredSize : 0,
      mimeType: (headers['content-type'] ?? '').split(';')[0],
      encoding: headers['content-encoding'],
      cacheControl: headers['cache-control'],
      fromCache: res.fromServiceWorker(),
      durationMs: Date.now() - started,
    });
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error' && consoleErrors.length < 25) {
      consoleErrors.push(msg.text().slice(0, 300));
    }
  });

  page.on('pageerror', (err) => {
    if (consoleErrors.length < 25) consoleErrors.push(String(err.message).slice(0, 300));
  });

  const response = await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: config.navTimeout,
  });

  // Dá tempo para a página estabilizar (lazy load, fontes, hidratação).
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
  await page.waitForTimeout(1200);

  // Rola a página para disparar lazy loading e medir CLS real.
  await page
    .evaluate(async () => {
      const step = Math.max(window.innerHeight * 0.8, 400);
      for (let y = 0; y < document.body.scrollHeight && y < 12_000; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 300));
    })
    .catch(() => undefined);

  return { page, context, response, resources, consoleErrors };
}

/** Preenche o tamanho real dos recursos usando a Resource Timing API. */
async function enrichResourceSizes(page: Page, resources: NetworkResource[]): Promise<void> {
  const timing = await page
    .evaluate(() =>
      performance.getEntriesByType('resource').map((e) => {
        const r = e as PerformanceResourceTiming;
        return {
          url: r.name,
          transferSize: r.transferSize,
          decodedBodySize: r.decodedBodySize,
          duration: Math.round(r.duration),
        };
      }),
    )
    .catch(() => [] as { url: string; transferSize: number; decodedBodySize: number; duration: number }[]);

  const byUrl = new Map(timing.map((t) => [t.url, t]));
  for (const resource of resources) {
    const t = byUrl.get(resource.url);
    if (!t) continue;
    if (t.transferSize > 0) resource.transferSize = t.transferSize;
    if (t.decodedBodySize > 0) resource.resourceSize = t.decodedBodySize;
    if (t.duration > 0) resource.durationMs = t.duration;
  }
}

function toMetrics(raw: Record<string, number | null>): PerformanceMetrics {
  // Speed Index aproximado: média ponderada entre FCP e LCP.
  const fcp = raw.fcp ?? null;
  const lcp = raw.lcp ?? null;
  const speedIndex = fcp !== null && lcp !== null ? Math.round(fcp * 0.4 + lcp * 0.6) : (lcp ?? fcp);

  return {
    lcp,
    cls: raw.cls ?? null,
    inp: raw.inp ?? null,
    fcp,
    ttfb: raw.ttfb ?? null,
    speedIndex,
    tbt: raw.tbt ?? null,
    domContentLoaded: raw.domContentLoaded ?? null,
    load: raw.load ?? null,
    domNodes: raw.domNodes ?? null,
    longTasks: raw.longTasks ?? 0,
  };
}

/**
 * Coleta todo o contexto de auditoria: navegação desktop + mobile,
 * rede, DOM, arquivos auxiliares, DNS e TLS.
 */
/**
 * Coleta tudo que os módulos precisam, em uma passagem.
 *
 * O cancelamento (tempo esgotado ou visitante que fechou a aba) precisa fechar
 * as abas abertas: é isso que devolve a memória do Chromium. O `finally`
 * cuida do caminho normal e do caminho de erro; o listener de abort cuida do
 * caso em que ninguém mais está esperando o resultado.
 */
export async function collect(
  url: string,
  report: (message: string) => void,
  signal?: AbortSignal,
): Promise<AuditContext> {
  const openContexts = new Set<BrowserContext>();
  const closeAll = (): void => closeLeftovers(openContexts);

  signal?.addEventListener('abort', closeAll, { once: true });
  try {
    return await collectPage(url, report, openContexts);
  } finally {
    closeAll();
    signal?.removeEventListener('abort', closeAll);
  }
}

async function collectPage(
  url: string,
  report: (message: string) => void,
  openContexts: Set<BrowserContext>,
): Promise<AuditContext> {
  const startedAt = Date.now();
  const target = new URL(url);
  const origin = target.origin;

  const track = <T extends { context: BrowserContext }>(nav: T): T => {
    openContexts.add(nav.context);
    return nav;
  };
  const done = (context: BrowserContext): void => {
    openContexts.delete(context);
  };

  report('Abrindo página em Chromium (desktop)…');
  const desktopNav = track(await openPage(url, DESKTOP, false));
  const { page, context, response } = desktopNav;

  const finalUrl = page.url();
  const statusCode = response?.status() ?? 0;
  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(response?.headers() ?? {})) {
    headers[k.toLowerCase()] = v;
  }

  const redirectChain: RedirectHop[] = [];
  let redirect = response?.request().redirectedFrom();
  while (redirect) {
    const res = await redirect.response();
    redirectChain.unshift({ url: redirect.url(), status: res?.status() ?? 0 });
    redirect = redirect.redirectedFrom();
  }

  report('Extraindo DOM e dados estruturados…');
  await enrichResourceSizes(page, desktopNav.resources);
  const dom = await extractDom(page, origin);
  const renderedHtml = await page.content();
  const desktopMetricsRaw = await collectMetrics(page);
  const desktopViewport = await measureViewport(page);
  const cookies: CookieInfo[] = (await context.cookies()).map((c) => ({
    name: c.name,
    domain: c.domain,
    secure: c.secure,
    httpOnly: c.httpOnly,
    sameSite: c.sameSite ?? 'None',
    expires: c.expires,
  }));

  const desktop: ViewportSnapshot = {
    ...DESKTOP,
    metrics: toMetrics(desktopMetricsRaw),
    ...desktopViewport,
  };

  await context.close().catch(() => undefined);
  done(context);

  // ---- HTML bruto (sem execução de JS) ------------------------------------
  report('Baixando HTML bruto…');
  const rawHtml = await fetchText(finalUrl).then((r) => r?.text ?? '');

  // ---- Mobile -------------------------------------------------------------
  report('Repetindo a análise em viewport mobile…');
  let mobile: ViewportSnapshot;
  try {
    const mobileNav = track(await openPage(finalUrl, MOBILE, true));
    await enrichResourceSizes(mobileNav.page, mobileNav.resources);
    const mobileMetricsRaw = await collectMetrics(mobileNav.page);
    const mobileViewport = await measureViewport(mobileNav.page);
    mobile = { ...MOBILE, metrics: toMetrics(mobileMetricsRaw), ...mobileViewport };
    await mobileNav.context.close().catch(() => undefined);
    done(mobileNav.context);
  } catch {
    mobile = {
      ...MOBILE,
      metrics: toMetrics({}),
      horizontalOverflow: false,
      overflowingSelectors: [],
      smallTapTargets: [],
      smallFonts: [],
    };
  }

  // ---- Arquivos auxiliares, DNS e TLS -------------------------------------
  report('Verificando robots.txt, llms.txt, security.txt, sitemap, DNS e TLS…');
  const [robotsTxt, llmsTxt, llmsFullTxt, securityTxt, securityTxtRoot, dnsResult, tlsResult] =
    await Promise.all([
      fetchText(`${origin}/robots.txt`),
      fetchText(`${origin}/llms.txt`),
      fetchText(`${origin}/llms-full.txt`),
      fetchText(`${origin}/.well-known/security.txt`),
      fetchText(`${origin}/security.txt`),
      inspectDns(target.hostname),
      target.protocol === 'https:' ? inspectTls(target.hostname) : Promise.resolve(null),
    ]);

  // A localização canônica é /.well-known/security.txt; /security.txt é fallback.
  const security = securityTxt?.ok ? securityTxt : securityTxtRoot?.ok ? securityTxtRoot : securityTxt;

  const sitemaps = await collectSitemaps(origin, robotsTxt?.ok ? robotsTxt.text : null);

  const network: NetworkInfo = {
    protocol: headers[':protocol'] ?? (response ? await detectProtocol(page, finalUrl) : null),
    ipAddresses: [...dnsResult.v4, ...dnsResult.v6],
    ipv6: dnsResult.v6.length > 0,
    tls: tlsResult,
    dns: {
      resolved: dnsResult.v4.length + dnsResult.v6.length > 0,
      records: [...dnsResult.v4, ...dnsResult.v6],
      ttlHint: null,
    },
    cdn: detectCdn(headers),
    server: headers['server'] ?? null,
  };

  return {
    url,
    finalUrl,
    origin,
    html: rawHtml,
    renderedHtml,
    statusCode,
    headers,
    redirectChain,
    resources: desktopNav.resources,
    desktop,
    mobile,
    network,
    robotsTxt,
    llmsTxt,
    llmsFullTxt,
    securityTxt: security,
    sitemaps,
    dom,
    cookies,
    consoleErrors: desktopNav.consoleErrors,
    startedAt,
    report,
  };
}

/** Fecha o que sobrou de aberto — chamado no fim e no cancelamento. */
function closeLeftovers(contexts: Set<BrowserContext>): void {
  for (const context of contexts) void context.close().catch(() => undefined);
  contexts.clear();
}

/** Descobre o protocolo HTTP negociado (h2, h3, http/1.1). */
async function detectProtocol(_page: Page, url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { method: 'HEAD', headers: { 'user-agent': USER_AGENT } });
    // Node não expõe o protocolo diretamente; usamos alt-svc como indicador de HTTP/3.
    const altSvc = res.headers.get('alt-svc');
    if (altSvc?.includes('h3')) return 'h3';
    return null;
  } catch {
    return null;
  }
}
