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
  ExposedFile,
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

// ===========================================================================
// Sondagem de arquivos sensíveis expostos
// ===========================================================================
// Requisita, por GET, caminhos conhecidos que nunca deveriam ser públicos
// (.env, .git, dumps, backups, credenciais). É a MESMA natureza da busca por
// robots.txt/security.txt — nenhum payload de ataque, apenas o pedido de uma
// URL. A confirmação é por ASSINATURA DE CONTEÚDO: um 200 não basta, porque
// SPAs e páginas de erro devolvem 200 + index.html para qualquer rota; só
// contamos como exposição quando o corpo é reconhecidamente o arquivo.

interface ProbeResult {
  status: number;
  finalOrigin: string | null;
  contentType: string | null;
  /** Primeiros ~16 KB do corpo, decodificados como utf8. */
  body: string;
  /** Tamanho total do arquivo (do Content-Range/Length quando disponível). */
  totalBytes: number;
}

/** Lê no máximo `cap` bytes do corpo, mesmo que o servidor ignore o Range. */
async function readCapped(res: Response, cap: number): Promise<Buffer> {
  const reader = res.body?.getReader();
  if (!reader) return Buffer.from(await res.arrayBuffer()).subarray(0, cap);
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (total < cap) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        total += value.length;
      }
    }
  } finally {
    void reader.cancel().catch(() => undefined);
  }
  return Buffer.concat(chunks).subarray(0, cap);
}

async function fetchProbe(url: string, origin: string, timeoutMs = 8_000): Promise<ProbeResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'user-agent': USER_AGENT, accept: '*/*', range: 'bytes=0-16383' },
    });
    let finalOrigin: string | null = null;
    try {
      finalOrigin = new URL(res.url || url).origin;
    } catch {
      finalOrigin = null;
    }
    // Só respostas diretas (200/206) na PRÓPRIA origem interessam. Um
    // redirecionamento para outro host (login, home) não expõe o arquivo.
    if ((res.status !== 200 && res.status !== 206) || finalOrigin !== origin) {
      void res.body?.cancel().catch(() => undefined);
      return { status: res.status, finalOrigin, contentType: res.headers.get('content-type'), body: '', totalBytes: 0 };
    }
    const buf = await readCapped(res, 16_384);
    const rangeTotal = res.headers.get('content-range')?.split('/')?.[1];
    const total = Number(rangeTotal ?? res.headers.get('content-length') ?? buf.byteLength);
    return {
      status: res.status,
      finalOrigin,
      contentType: res.headers.get('content-type'),
      body: buf.toString('utf8'),
      totalBytes: Number.isFinite(total) && total > 0 ? total : buf.byteLength,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Um HTML (SPA fallback, login, página de erro) nunca é o arquivo sensível. */
function looksHtml(b: string): boolean {
  return /<(?:!doctype\s+html|html[\s>]|head[\s>]|body[\s>]|title[\s>])/i.test(b.slice(0, 1500));
}

/** Assinatura de um arquivo de variáveis de ambiente (.env e variações). */
function isEnvFile(b: string): boolean {
  if (looksHtml(b)) return false;
  const sensitive =
    /(?:^|\n)\s*(?:export\s+)?[A-Z0-9_]*(?:SECRET|PASSWORD|PASSWD|API[_-]?KEY|APIKEY|TOKEN|PRIVATE[_-]?KEY|ACCESS[_-]?KEY|DATABASE_URL|DB_(?:PASS|PASSWORD|HOST|USER|NAME)|AWS_|APP_KEY|MAIL_|SMTP_|STRIPE_|JWT_)[A-Z0-9_]*\s*=/i.test(b);
  const assignments = (b.match(/^\s*(?:export\s+)?[A-Za-z_][A-Za-z0-9_.]*\s*=/gm) ?? []).length;
  return sensitive || assignments >= 3;
}

/** Assinatura de um dump SQL. */
function isSqlDump(b: string): boolean {
  return /(?:CREATE TABLE|INSERT INTO|DROP TABLE IF EXISTS|-- MySQL dump|-- PostgreSQL database dump|CREATE DATABASE|LOCK TABLES)/i.test(
    b,
  );
}

interface ExposedProbe {
  path: string;
  label: string;
  severity: 'critical' | 'high' | 'medium';
  validate: (body: string, contentType: string | null) => boolean;
}

const EXPOSED_PROBES: ExposedProbe[] = [
  { path: '/.env', label: 'Variáveis de ambiente (.env)', severity: 'critical', validate: isEnvFile },
  { path: '/.env.local', label: 'Variáveis de ambiente (.env.local)', severity: 'critical', validate: isEnvFile },
  { path: '/.env.production', label: 'Variáveis de ambiente (.env.production)', severity: 'critical', validate: isEnvFile },
  { path: '/.env.bak', label: 'Backup de variáveis de ambiente (.env.bak)', severity: 'critical', validate: isEnvFile },
  {
    path: '/.git/config',
    label: 'Repositório Git exposto (.git/config)',
    severity: 'critical',
    validate: (b) => /\[core\]/.test(b) && /repositoryformatversion/i.test(b),
  },
  {
    path: '/.git/HEAD',
    label: 'Repositório Git exposto (.git/HEAD)',
    severity: 'high',
    validate: (b) => /^\s*ref:\s*refs\//m.test(b),
  },
  {
    path: '/.svn/wc.db',
    label: 'Repositório SVN exposto (.svn/wc.db)',
    severity: 'high',
    validate: (b) => b.startsWith('SQLite format 3'),
  },
  {
    path: '/.aws/credentials',
    label: 'Credenciais AWS (.aws/credentials)',
    severity: 'critical',
    validate: (b) => /aws_secret_access_key/i.test(b),
  },
  {
    path: '/.ssh/id_rsa',
    label: 'Chave SSH privada (.ssh/id_rsa)',
    severity: 'critical',
    validate: (b) => /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/.test(b),
  },
  {
    path: '/.npmrc',
    label: 'Token npm (.npmrc)',
    severity: 'high',
    validate: (b) => /_authToken\s*=|_auth\s*=|:_password\s*=/i.test(b),
  },
  {
    path: '/wp-config.php.bak',
    label: 'Configuração WordPress (wp-config.php.bak)',
    severity: 'critical',
    validate: (b) => /<\?php/.test(b) && /DB_(?:PASSWORD|NAME|USER)/.test(b),
  },
  {
    path: '/config.php.bak',
    label: 'Configuração PHP (config.php.bak)',
    severity: 'critical',
    validate: (b) => /<\?php/.test(b) && /(?:db_pass|password|passwd|mysqli?_connect)/i.test(b),
  },
  { path: '/backup.sql', label: 'Dump de banco de dados (backup.sql)', severity: 'high', validate: isSqlDump },
  { path: '/dump.sql', label: 'Dump de banco de dados (dump.sql)', severity: 'high', validate: isSqlDump },
  { path: '/database.sql', label: 'Dump de banco de dados (database.sql)', severity: 'high', validate: isSqlDump },
  {
    path: '/.htpasswd',
    label: 'Credenciais HTTP (.htpasswd)',
    severity: 'high',
    validate: (b) => !looksHtml(b) && /^[^:\s]{1,64}:(?:\$(?:apr1|2[aby]|1|5|6)\$|\{SHA\}|[A-Za-z0-9./]{13}$)/m.test(b),
  },
  {
    path: '/.DS_Store',
    label: 'Índice de arquivos macOS (.DS_Store)',
    severity: 'medium',
    validate: (b) => b.includes('Bud1'),
  },
  {
    path: '/phpinfo.php',
    label: 'phpinfo() exposto',
    severity: 'medium',
    validate: (b) => /phpinfo\(\)|<title>phpinfo\(\)|PHP Version\s*<\/td>/i.test(b),
  },
  {
    path: '/docker-compose.yml',
    label: 'docker-compose.yml exposto',
    severity: 'medium',
    validate: (b) => !looksHtml(b) && /^services:\s*$/m.test(b),
  },
  {
    path: '/server-status',
    label: 'Apache server-status exposto',
    severity: 'medium',
    validate: (b) => /Apache Server Status|<title>Apache Status/i.test(b),
  },
];

// Caminho improvável usado como controle: se ele responder 200 com corpo, o
// servidor tem um catch-all e comparamos os corpos para não marcar exposição
// onde tudo devolve a mesma página.
const PROBE_CONTROL_PATH = '/fast-probe-4f7a2e91-should-not-exist.txt';

/** Sonda os caminhos sensíveis e devolve apenas as exposições confirmadas. */
async function probeExposedFiles(origin: string, report: (message: string) => void): Promise<ExposedFile[]> {
  report('Sondando arquivos sensíveis expostos (.env, .git, backups)…');

  const control = await fetchProbe(`${origin}${PROBE_CONTROL_PATH}`, origin);
  const catchAllBody = control && control.status === 200 && control.body ? control.body.slice(0, 4096) : null;

  const found = await Promise.all(
    EXPOSED_PROBES.map(async (probe): Promise<ExposedFile | null> => {
      const r = await fetchProbe(`${origin}${probe.path}`, origin);
      if (!r || (r.status !== 200 && r.status !== 206) || !r.body) return null;
      // Servidor com catch-all 200 idêntico → não é exposição real.
      if (catchAllBody && r.body.slice(0, 4096) === catchAllBody) return null;
      if (!probe.validate(r.body, r.contentType)) return null;
      return {
        path: probe.path,
        label: probe.label,
        severity: probe.severity,
        status: r.status,
        sizeBytes: r.totalBytes,
        contentType: r.contentType,
      };
    }),
  );

  return found.filter((x): x is ExposedFile => x !== null);
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
  const [robotsTxt, llmsTxt, llmsFullTxt, securityTxt, securityTxtRoot, dnsResult, tlsResult, exposedPaths] =
    await Promise.all([
      fetchText(`${origin}/robots.txt`),
      fetchText(`${origin}/llms.txt`),
      fetchText(`${origin}/llms-full.txt`),
      fetchText(`${origin}/.well-known/security.txt`),
      fetchText(`${origin}/security.txt`),
      inspectDns(target.hostname),
      target.protocol === 'https:' ? inspectTls(target.hostname) : Promise.resolve(null),
      probeExposedFiles(origin, report),
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
    exposedPaths,
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
