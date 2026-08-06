import { scoreFromChecks } from '../../core/scoring.js';
import type { AuditContext, AuditPlugin, Check, PluginIssue } from '../../core/types.js';
import { check, formatBytes, issue } from '../helpers.js';

/**
 * Módulo Proteção & Exposição.
 *
 * Avalia a POSTURA de segurança do site auditado de forma estritamente PASSIVA:
 * analisa apenas o que o site já devolve (cabeçalhos, cookies, HTML e a própria
 * estrutura de links/formulários). Nenhum payload de ataque é enviado — a FAST
 * é uma ferramenta pública e auditar sites de terceiros com injeções ativas
 * seria teste de intrusão não autorizado.
 *
 * Cobre: presença de WAF/firewall, exposição do IP de origem, vazamento de
 * versão/tecnologia, vazamento de erros de banco (sinal de suscetibilidade a
 * SQL injection), superfícies de parâmetros e política de divulgação (security.txt).
 */

// ---- Impressões digitais de WAF / CDN de proteção (passivas) ---------------
interface WafSignal {
  name: string;
  header?: string;
  headerValue?: RegExp;
  cookie?: RegExp;
}

const WAF_SIGNATURES: WafSignal[] = [
  { name: 'Cloudflare', header: 'cf-ray' },
  { name: 'Cloudflare', header: 'server', headerValue: /cloudflare/i },
  { name: 'Sucuri', header: 'x-sucuri-id' },
  { name: 'Sucuri', header: 'x-sucuri-cache' },
  { name: 'Imperva/Incapsula', header: 'x-iinfo' },
  { name: 'Imperva/Incapsula', cookie: /^(incap_ses|visid_incap)/i },
  { name: 'Akamai', header: 'x-akamai-transformed' },
  { name: 'Akamai', header: 'akamai-grn' },
  { name: 'AWS WAF / CloudFront', header: 'x-amz-cf-id' },
  { name: 'Fastly', header: 'x-served-by', headerValue: /cache-/i },
  { name: 'Fastly', header: 'fastly-restarts' },
  { name: 'F5 BIG-IP', cookie: /^BIGipServer/i },
  { name: 'F5 BIG-IP', cookie: /^TS[0-9a-f]{6,}/ },
  { name: 'Barracuda', cookie: /^barra_counter_session/i },
  { name: 'Wordfence', cookie: /^wordfence_verifiedHuman/i },
  { name: 'StackPath', header: 'x-sp-request-id' },
  { name: 'Wallarm', header: 'x-wallarm' },
  { name: 'Reblaze', cookie: /^rbzid/i },
  { name: 'ModSecurity', header: 'server', headerValue: /mod_security|modsecurity/i },
  { name: 'Azure Front Door', header: 'x-azure-ref' },
];

// ---- Vazamento de versão / tecnologia --------------------------------------
const VERSION_HEADERS = ['x-powered-by', 'x-aspnet-version', 'x-aspnetmvc-version', 'x-generator', 'x-drupal-cache', 'x-runtime'];

// ---- Assinaturas de erro de banco de dados (indício de SQLi) ----------------
// Estas frases aparecem quando o site expõe erros de banco brutos ao visitante.
// Detectá-las é passivo: elas já estão no HTML devolvido normalmente.
const SQL_ERROR_SIGNATURES: { db: string; re: RegExp }[] = [
  { db: 'MySQL', re: /SQL syntax.*(MySQL|MariaDB)|You have an error in your SQL syntax|valid MySQL result|mysqli?_(query|fetch|num_rows)|supplied argument is not a valid MySQL/i },
  { db: 'PostgreSQL', re: /PostgreSQL.*ERROR|pg_(query|exec)\(\)|PG::\w*Error|Npgsql\./i },
  { db: 'Microsoft SQL Server', re: /Microsoft OLE DB Provider for SQL Server|Unclosed quotation mark after the character string|System\.Data\.SqlClient\.SqlException|SQLServer JDBC Driver|\[SQL Server\]/i },
  { db: 'Oracle', re: /\bORA-\d{5}\b|Oracle error|quoted string not properly terminated|OracleException/i },
  { db: 'SQLite', re: /SQLite\/JDBCDriver|SQLite3::|sqlite3\.OperationalError|\[SQLITE_ERROR\]/i },
  { db: 'Genérico', re: /SQLSTATE\[\w+\]|java\.sql\.SQLException|Dynamic SQL Error|System\.Data\.OleDb\.OleDbException/i },
];

// ---- Stack traces / erros verbosos de aplicação ----------------------------
const STACKTRACE_SIGNATURES = [
  /Traceback \(most recent call last\)/,
  /Stack trace:\s*\n?#0/,
  /\bat [\w.$]+\([\w.]+\.java:\d+\)/,
  /Fatal error:.*on line \d+/i,
  /Warning:.*on line \d+ in/i,
  /Microsoft \.NET Framework.*Exception/i,
  /Whoops\\Exception|laravel\.log|symfony.*Exception/i,
];

// ---- Segredos e credenciais expostos no HTML/JS servido (passivo) ----------
// Padrões de alta confiança de chaves e tokens que nunca deveriam aparecer no
// código entregue ao navegador. A detecção é passiva: o conteúdo já é servido.
interface SecretPattern {
  name: string;
  re: RegExp;
  severity: 'critical' | 'high' | 'medium';
}

const SECRET_PATTERNS: SecretPattern[] = [
  { name: 'Chave privada (PEM)', re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/, severity: 'critical' },
  { name: 'AWS Access Key ID', re: /\bAKIA[0-9A-Z]{16}\b/, severity: 'critical' },
  { name: 'AWS Secret Access Key', re: /\baws_secret_access_key["'\s:=]+[A-Za-z0-9/+]{40}\b/i, severity: 'critical' },
  { name: 'Stripe Secret Key', re: /\bsk_live_[0-9A-Za-z]{24,}\b/, severity: 'critical' },
  { name: 'GitHub Token', re: /\b(?:ghp|gho|ghs|ghu)_[0-9A-Za-z]{36}\b|\bgithub_pat_[0-9A-Za-z_]{50,}\b/, severity: 'critical' },
  { name: 'Google API Key', re: /\bAIza[0-9A-Za-z_\-]{35}\b/, severity: 'high' },
  { name: 'Slack Token', re: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/, severity: 'high' },
  { name: 'Chave privada OpenAI/Anthropic', re: /\b(?:sk-ant-|sk-)[A-Za-z0-9_\-]{20,}\b/, severity: 'high' },
  { name: 'Credenciais na URL (user:senha@)', re: /\bhttps?:\/\/[^/\s"'<>:@]+:[^/\s"'<>:@]{3,}@[^/\s"'<>]+/i, severity: 'high' },
  { name: 'Twilio Account SID', re: /\bAC[0-9a-f]{32}\b/, severity: 'medium' },
];

// Atribuição genérica de senha/segredo em código (baixa confiança → medium).
const GENERIC_SECRET_RE =
  /["'`]?(?:password|passwd|senha|secret|api[_-]?key|access[_-]?token|auth[_-]?token|private[_-]?key)["'`]?\s*[:=]\s*["'`]([^"'`\s]{8,})["'`]/gi;
const PLACEHOLDER_RE = /^(?:your|my|the|example|sample|test|demo|xxx+|changeme|placeholder|redacted|\*+|\.+|<.*>|\$\{.*\}|%.*%)/i;

/** Mascara um segredo para evidência: mostra o suficiente para localizar, não para usar. */
function maskSecret(s: string): string {
  const clean = s.trim();
  if (clean.length <= 8) return `${clean.slice(0, 2)}***`;
  return `${clean.slice(0, 4)}***${clean.slice(-2)} (${clean.length} chars)`;
}

/** Extrai valores de cabeçalho que parecem endereços IPv4. */
function extractIps(value: string): string[] {
  return value.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) ?? [];
}

function isPrivateIp(ip: string): boolean {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isFinite(n) || n > 255)) return false;
  return (
    p[0] === 10 ||
    p[0] === 127 ||
    (p[0] === 192 && p[1] === 168) ||
    (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
    (p[0] === 169 && p[1] === 254) ||
    (p[0] === 100 && p[1] >= 64 && p[1] <= 127)
  );
}

// ---- Faixas de IP de CDNs que escondem a origem (IPv4, publicadas) ---------
// Se o IP resolvido cai numa destas faixas, o que responde é um nó de borda —
// a origem real está escondida. Fora delas (e sem sinal de proxy), o IP que
// responde é o próprio servidor, exposto diretamente à internet.
const CDN_RANGES: Record<string, string[]> = {
  Cloudflare: [
    '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22',
    '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20',
    '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
    '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
  ],
  Fastly: [
    '151.101.0.0/16', '199.232.0.0/16', '23.235.32.0/20', '43.249.72.0/22',
    '104.156.80.0/20', '146.75.0.0/16', '167.82.0.0/17', '172.111.64.0/18',
    '185.31.16.0/22',
  ],
};

function ipv4ToInt(ip: string): number | null {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) return null;
  return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3];
}

function inCidr(ip: string, cidr: string): boolean {
  const [range, bitsStr] = cidr.split('/');
  const bits = Number(bitsStr);
  const ipInt = ipv4ToInt(ip);
  const rangeInt = ipv4ToInt(range);
  if (ipInt === null || rangeInt === null) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipInt & mask) === (rangeInt & mask);
}

/** Nome do CDN se o IP for de borda; null se for um IP comum (provável origem). */
function classifyCdnIp(ip: string): string | null {
  for (const [name, ranges] of Object.entries(CDN_RANGES)) {
    if (ranges.some((cidr) => inCidr(ip, cidr))) return name;
  }
  return null;
}

const plugin: AuditPlugin = {
  id: 'protection',
  name: 'Proteção & Exposição',
  description:
    'Avaliação passiva da postura de segurança: WAF/firewall, exposição do IP externo de origem, arquivos sensíveis acessíveis (.env, .git, dumps), vazamento de chaves e senhas no código, suscetibilidade a SQL injection, transporte de senha e política de divulgação.',
  category: 'protection',
  weight: 2.5,
  checks: [
    'WAF / firewall de aplicação',
    'IP externo de origem oculto (CDN/proxy)',
    'Sem vazamento de IP interno',
    'Sem divulgação de versão/tecnologia',
    'Sem arquivos sensíveis acessíveis',
    'Sem chaves/segredos no código servido',
    'Sem senha hardcoded',
    'Transporte seguro de senha (HTTPS, POST)',
    'Sem vazamento de erros de banco (SQLi)',
    'Sem stack traces expostos',
    'Superfície de parâmetros na URL',
    'security.txt (política de divulgação)',
    'Listagem de diretórios desabilitada',
  ],

  async run(ctx: AuditContext) {
    const checks: Check[] = [];
    const issues: PluginIssue[] = [];
    const recommendations: string[] = [];
    const h = ctx.headers;
    const html = ctx.html || ctx.renderedHtml;

    // =====================================================================
    // 1. WAF / firewall de aplicação
    // =====================================================================
    const detectedWafs = new Set<string>();
    for (const sig of WAF_SIGNATURES) {
      if (sig.header) {
        const value = h[sig.header];
        if (value !== undefined && (!sig.headerValue || sig.headerValue.test(value))) {
          detectedWafs.add(sig.name);
        }
      }
      if (sig.cookie && ctx.cookies.some((c) => sig.cookie!.test(c.name))) {
        detectedWafs.add(sig.name);
      }
    }

    // ---- Classificação dos IPs públicos: borda de CDN ou origem exposta? ----
    const publicIpv4 = ctx.network.ipAddresses.filter(
      (ip) => ipv4ToInt(ip) !== null && !isPrivateIp(ip),
    );
    const publicIpv6 = ctx.network.ipAddresses.filter((ip) => ip.includes(':'));
    const cdnIps = publicIpv4.map((ip) => ({ ip, cdn: classifyCdnIp(ip) })).filter((x) => x.cdn);
    // IPv4 público que NÃO é de nenhuma borda conhecida = provável servidor de origem.
    const exposedIps = publicIpv4.filter((ip) => !classifyCdnIp(ip));

    // Origem protegida se: cabeçalho de CDN, WAF identificado, OU o IP resolvido
    // pertence a uma faixa de CDN. Detecção passiva confirma um WAF, mas não
    // prova a ausência — por isso "WAF não confirmado" é alerta, não certeza.
    const hasWaf = detectedWafs.size > 0;
    const hasProxy = Boolean(ctx.network.cdn) || hasWaf || cdnIps.length > 0;
    const originExposed = !hasProxy && exposedIps.length > 0;

    checks.push(check('waf', 'WAF / firewall de aplicação', hasWaf ? 1 : hasProxy ? 0.6 : 0.3, 2, hasWaf ? [...detectedWafs].join(', ') : 'não confirmado'));

    if (!hasWaf) {
      issues.push(
        issue({
          id: 'prot-no-waf',
          title: hasProxy ? 'WAF não confirmado' : 'Sem WAF na frente do site',
          description: hasProxy
            ? 'Há um CDN/proxy na frente, mas nenhuma assinatura de WAF foi identificada nas respostas. A detecção é passiva e não vê todos os WAFs; confirme se as regras de firewall de aplicação estão de fato ativas no seu provedor de borda.'
            : `Não há CDN/proxy nem assinatura de WAF nas respostas — o site aparenta receber requisições diretamente na origem (${exposedIps.slice(0, 2).join(', ') || 'IP não classificado'}). Sem WAF, cada tentativa de SQL injection, XSS ou varredura automatizada chega direto à aplicação.`,
          severity: hasProxy ? 'low' : 'high',
          impact: 'alto',
          difficulty: 'media',
          minutes: 60,
          fix: hasProxy
            ? 'No painel do seu CDN (Cloudflare, AWS, etc.), ative o conjunto de regras gerenciadas de WAF (OWASP Core Rule Set) em modo bloqueante e confirme que ele cobre este hostname.'
            : 'Passo a passo: (1) coloque o site atrás de um proxy com WAF — Cloudflare (plano gratuito já inclui regras básicas) ou AWS WAF + CloudFront; (2) ative o OWASP Core Rule Set em modo bloqueante; (3) teste o site normalmente por alguns dias em modo de contagem antes de bloquear, para não barrar tráfego legítimo.',
          gain: 'Bloqueio automático da maioria dos ataques conhecidos (OWASP Top 10) antes de chegarem ao servidor.',
        }),
      );
    }

    // =====================================================================
    // 2. Exposição do IP externo de origem
    // =====================================================================
    // Rigor: cruzamos os IPs públicos com as faixas conhecidas de CDN. Se o IP
    // NÃO é de nenhuma borda conhecida e não há proxy, ele é o servidor real,
    // alcançável diretamente da internet — isso é confirmado, não suposição.
    const originValue = ctx.network.cdn
      ? ctx.network.cdn
      : cdnIps.length > 0
        ? `borda ${cdnIps[0].cdn}`
        : originExposed
          ? `IP exposto: ${exposedIps[0]}`
          : 'sem IPv4 público';
    checks.push(check('origin-protected', 'IP de origem oculto atrás de CDN/proxy', hasProxy ? 1 : originExposed ? 0 : 0.5, 2, originValue));

    if (originExposed) {
      issues.push(
        issue({
          id: 'prot-origin-exposed',
          title: `IP externo de origem exposto (${exposedIps.join(', ')})`,
          description:
            `Os endereços ${exposedIps.join(', ')} respondem por este host e não pertencem a nenhuma rede de CDN conhecida — ou seja, é o próprio servidor de origem, alcançável diretamente da internet. Sem uma borda (Cloudflare, CloudFront, Fastly) na frente, um atacante mira o IP diretamente: negação de serviço volumétrica (DDoS), varredura de portas, e ataques que contornam qualquer proteção que dependesse do DNS. Route53 sozinho não resolve — ele é só DNS e continua publicando o IP real; é preciso um proxy que receba o tráfego no lugar da origem.`,
          severity: 'high',
          impact: 'alto',
          difficulty: 'media',
          minutes: 60,
          fix:
            'Passo a passo: (1) coloque um proxy reverso que esconda a origem — Cloudflare (proxy laranja ativado) ou CloudFront/Fastly na frente do servidor; (2) troque o registro DNS para apontar ao proxy, não mais ao IP do servidor; (3) reconfigure o firewall da máquina (ufw/iptables/Security Group) para aceitar as portas 80 e 443 SOMENTE das faixas de IP do CDN e recusar o resto — assim, mesmo quem descobrir o IP antigo não alcança a origem; (4) se possível, troque o IP público do servidor após a migração, para invalidar registros históricos que já vazaram o endereço.',
          gain: 'O IP de origem deixa de ser alcançável diretamente; ataques volumétricos são absorvidos na borda e não derrubam o servidor.',
          evidence: [
            ...exposedIps.map((ip) => `IPv4 de origem exposto: ${ip}`),
            ...publicIpv6.map((ip) => `IPv6 público: ${ip}`),
          ],
        }),
      );
    }

    // Vazamento de IP interno em cabeçalhos (mesmo atrás de proxy).
    const ipLeakHeaders = ['via', 'x-served-by', 'x-backend-server', 'x-real-ip', 'x-forwarded-for', 'x-host', 'x-served-ip'];
    const leakedIps: string[] = [];
    for (const name of ipLeakHeaders) {
      const value = h[name];
      if (!value) continue;
      for (const ip of extractIps(value)) {
        if (isPrivateIp(ip)) leakedIps.push(`${name}: ${ip}`);
      }
    }
    // IPs privados também podem vazar no HTML (config exposta, comentários).
    for (const ip of (html.match(/\b(?:10|127|192\.168|169\.254|172\.(?:1[6-9]|2\d|3[01]))(?:\.\d{1,3}){1,3}\b/g) ?? []).slice(0, 5)) {
      if (isPrivateIp(ip)) leakedIps.push(`HTML: ${ip}`);
    }

    checks.push(check('no-internal-ip-leak', 'Sem vazamento de IP interno', leakedIps.length === 0 ? 1 : 0, 1, leakedIps.length > 0 ? `${leakedIps.length} ocorrência(s)` : 'ok'));

    if (leakedIps.length > 0) {
      issues.push(
        issue({
          id: 'prot-internal-ip-leak',
          title: 'Endereço IP interno exposto',
          description:
            'Um endereço de rede interna aparece em cabeçalhos de resposta ou no HTML. Isso revela a topologia da infraestrutura (proxies, balanceadores, servidores de aplicação) e facilita o mapeamento do ambiente por um atacante.',
          severity: 'low',
          impact: 'baixo',
          difficulty: 'facil',
          minutes: 20,
          fix: 'Remova cabeçalhos que expõem IPs internos (X-Backend-Server, X-Real-IP, Via) na configuração do proxy reverso, e retire IPs internos de comentários e páginas de erro.',
          gain: 'Menos informação sobre a topologia interna disponível para um atacante.',
          evidence: [...new Set(leakedIps)].slice(0, 8),
        }),
      );
    }

    // =====================================================================
    // 3. Divulgação de versão / tecnologia
    // =====================================================================
    const disclosures: string[] = [];
    const serverHeader = h['server'] ?? '';
    if (/\d+\.\d+/.test(serverHeader)) disclosures.push(`Server: ${serverHeader}`);
    for (const name of VERSION_HEADERS) {
      if (h[name]) disclosures.push(`${name}: ${h[name]}`);
    }
    const metaGenerator = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i);
    if (metaGenerator && /\d/.test(metaGenerator[1])) disclosures.push(`meta generator: ${metaGenerator[1]}`);

    checks.push(check('version-disclosure', 'Sem divulgação de versão/tecnologia', disclosures.length === 0 ? 1 : Math.max(0, 1 - disclosures.length / 3), 1.5, disclosures.length > 0 ? `${disclosures.length} sinal(is)` : 'ok'));

    if (disclosures.length > 0) {
      issues.push(
        issue({
          id: 'prot-tech-disclosure',
          title: 'Servidor divulga versão e tecnologia',
          description:
            'Cabeçalhos e metadados revelam a stack e as versões em uso. Um atacante usa exatamente essa informação para selecionar exploits conhecidos que afetam aquela versão específica — é o primeiro passo de qualquer varredura automatizada.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 20,
          fix:
            'Oculte as versões: no nginx use `server_tokens off;`; no Apache `ServerTokens Prod` e `ServerSignature Off`; remova o cabeçalho X-Powered-By na aplicação (no Express, `app.disable("x-powered-by")`); e remova a meta generator com versão.',
          gain: 'Ataques automatizados por versão perdem o alvo; a superfície fica opaca.',
          evidence: disclosures,
        }),
      );
    }

    // =====================================================================
    // 4. SQL injection — sinais passivos
    // =====================================================================
    const sqlLeaks = SQL_ERROR_SIGNATURES.filter((s) => s.re.test(html)).map((s) => s.db);
    checks.push(check('sql-error-leak', 'Sem vazamento de erros de banco', sqlLeaks.length === 0 ? 1 : 0, 3, sqlLeaks.length > 0 ? sqlLeaks.join(', ') : 'ok'));

    if (sqlLeaks.length > 0) {
      issues.push(
        issue({
          id: 'prot-sql-error-leak',
          title: `Erros de banco de dados expostos (${sqlLeaks.join(', ')})`,
          description:
            'A página exibe mensagens de erro brutas do banco de dados. Isso é um sinal forte de suscetibilidade a SQL injection: além de revelar a estrutura das tabelas e consultas, indica que a entrada do usuário chega ao banco sem tratamento e que os erros não são capturados. É exatamente o retorno que um atacante procura para confirmar e explorar uma injeção.',
          severity: 'critical',
          impact: 'alto',
          difficulty: 'media',
          minutes: 120,
          fix:
            'Duas frentes: (1) use sempre consultas parametrizadas / prepared statements — nunca concatene entrada do usuário em SQL; (2) capture as exceções de banco e exiba uma página de erro genérica, registrando o detalhe apenas no log do servidor. Em produção, desligue a exibição de erros (por exemplo `display_errors = Off` no PHP).',
          gain: 'Fecha o principal vetor de exfiltração de dados e para de entregar o mapa do banco ao atacante.',
          evidence: sqlLeaks.map((db) => `Assinatura de erro ${db} encontrada no HTML`),
        }),
      );
    }

    const stackTraces = STACKTRACE_SIGNATURES.filter((re) => re.test(html));
    checks.push(check('no-stacktrace', 'Sem stack traces expostos', stackTraces.length === 0 ? 1 : 0, 1.5, stackTraces.length > 0 ? 'presente' : 'ok'));

    if (stackTraces.length > 0) {
      issues.push(
        issue({
          id: 'prot-stacktrace',
          title: 'Stack trace de aplicação exposto',
          description:
            'A página revela um rastreamento de pilha (stack trace). Ele expõe caminhos de arquivos, nomes de funções internas, bibliotecas e versões — informação valiosa para um atacante montar a exploração, e um sinal de que o tratamento de erros está desligado ou mal configurado.',
          severity: 'high',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 40,
          fix: 'Desative a exibição de erros detalhados em produção e configure uma página de erro 500 genérica. Registre o detalhe apenas no log do servidor.',
          gain: 'Elimina o vazamento de detalhes internos da aplicação.',
        }),
      );
    }

    // Superfície de parâmetros: links internos com query string potencialmente injetável.
    const paramLinks = ctx.dom.links
      .filter((l) => l.internal && /[?&](id|user|uid|cat|category|page|item|product|pid|search|q|query|order|sort|file|path|dir)=/i.test(l.absolute))
      .slice(0, 12);

    checks.push(check('param-surface', 'Superfície de parâmetros controlada', paramLinks.length <= 3 ? 1 : Math.max(0.3, 1 - paramLinks.length / 20), 0.5, `${paramLinks.length} URL(s) com parâmetro`));

    // Formulários GET com campos que viram parâmetros de URL.
    const getForms = ctx.dom.forms.filter((f) => f.fields > 0);
    if ((sqlLeaks.length > 0 || !hasWaf) && (paramLinks.length > 0 || getForms.length > 0)) {
      recommendations.push(
        'Há superfícies que recebem entrada do usuário (parâmetros de URL e formulários). Garanta consultas parametrizadas, validação de tipo na entrada (por exemplo, IDs numéricos) e um WAF na frente como defesa em profundidade.',
      );
    }

    // =====================================================================
    // 5. Vazamento de credenciais e senhas (passivo)
    // =====================================================================
    // Varre o HTML e os scripts inline entregues ao navegador em busca de
    // chaves, tokens e senhas. Os valores são MASCARADOS na evidência — nunca
    // exibimos o segredo completo.
    const scanText = `${ctx.renderedHtml || ''}\n${ctx.html || ''}`.slice(0, 3_000_000);
    const secretsFound: { name: string; severity: 'critical' | 'high' | 'medium'; sample: string }[] = [];

    for (const pat of SECRET_PATTERNS) {
      const m = scanText.match(pat.re);
      if (m) secretsFound.push({ name: pat.name, severity: pat.severity, sample: maskSecret(m[0]) });
    }

    // Atribuições genéricas de senha/segredo, ignorando placeholders óbvios.
    const genericHits = new Set<string>();
    for (const m of scanText.matchAll(GENERIC_SECRET_RE)) {
      const value = m[1];
      if (PLACEHOLDER_RE.test(value)) continue;
      genericHits.add(maskSecret(value));
      if (genericHits.size >= 5) break;
    }

    const criticalSecrets = secretsFound.filter((s) => s.severity === 'critical');
    const anySecret = secretsFound.length > 0 || genericHits.size > 0;

    checks.push(check('no-exposed-secrets', 'Sem chaves/segredos no código servido', anySecret ? 0 : 1, 3, anySecret ? `${secretsFound.length + genericHits.size} ocorrência(s)` : 'ok'));

    if (secretsFound.length > 0) {
      issues.push(
        issue({
          id: 'prot-exposed-secret',
          title: `Segredo exposto no código: ${secretsFound.map((s) => s.name).join(', ')}`,
          description:
            'Uma ou mais chaves/tokens aparecem no HTML ou nos scripts entregues ao navegador. Qualquer visitante — e qualquer robô — consegue lê-los abrindo o código-fonte da página. Uma chave vazada permite acesso indevido aos serviços que ela autentica (nuvem, gateway de pagamento, repositório), muitas vezes com custo financeiro direto.',
          severity: criticalSecrets.length > 0 ? 'critical' : 'high',
          impact: 'alto',
          difficulty: 'media',
          minutes: 90,
          fix:
            'Passo a passo: (1) REVOGUE a chave imediatamente no provedor — considere-a comprometida, pois já foi servida publicamente; (2) gere uma nova e mantenha-a apenas no servidor (variável de ambiente), nunca no código do frontend; (3) mova a chamada que usa a chave para o backend, expondo ao navegador só um endpoint próprio; (4) se for uma chave que precisa mesmo ir ao cliente (ex.: Google Maps), restrinja-a por domínio/HTTP referer e por API no painel do provedor.',
          gain: 'Fecha o acesso indevido aos serviços autenticados pela chave e elimina o risco de custo por uso malicioso.',
          evidence: secretsFound.map((s) => `${s.name}: ${s.sample}`),
        }),
      );
    }

    if (genericHits.size > 0) {
      issues.push(
        issue({
          id: 'prot-hardcoded-password',
          title: `Possível senha/segredo hardcoded no código (${genericHits.size})`,
          description:
            'Foram encontradas atribuições que parecem senha ou segredo embutidas no HTML/JS servido. Pode haver falso positivo (valores de exemplo), mas cada ocorrência merece revisão manual — credenciais no código do frontend ficam visíveis a qualquer visitante.',
          severity: 'medium',
          impact: 'alto',
          difficulty: 'media',
          minutes: 40,
          fix:
            'Revise cada ocorrência. Se for uma credencial real, revogue-a e mova-a para o servidor. Nunca versione senhas em código; use variáveis de ambiente e um cofre de segredos.',
          gain: 'Elimina credenciais legíveis no código entregue ao navegador.',
          evidence: [...genericHits].map((s) => `valor mascarado: ${s}`),
        }),
      );
    }

    // Transporte de senha: campo de senha exige HTTPS e nunca método GET.
    const isHttps = ctx.finalUrl.startsWith('https://');
    const passwordForms = ctx.dom.forms.filter((f) => f.hasPassword);
    const passwordOverHttp = passwordForms.length > 0 && !isHttps;
    const passwordViaGet = passwordForms.filter((f) => f.method === 'get');
    const actionToHttp = passwordForms.filter((f) => f.action?.startsWith('http://'));

    const transportOk = !passwordOverHttp && passwordViaGet.length === 0 && actionToHttp.length === 0;
    checks.push(check('password-transport', 'Transporte seguro de senha', passwordForms.length === 0 ? 1 : transportOk ? 1 : 0, 2, passwordForms.length === 0 ? 'sem campo de senha' : transportOk ? 'seguro' : 'inseguro'));

    if (passwordOverHttp) {
      issues.push(
        issue({
          id: 'prot-password-http',
          title: 'Campo de senha em página sem HTTPS',
          description:
            'A página tem um campo de senha mas não é servida por HTTPS. A senha digitada trafega em texto claro e pode ser lida por qualquer intermediário na rede (Wi-Fi público, provedor, proxy). É um vazamento direto de credenciais.',
          severity: 'critical',
          impact: 'alto',
          difficulty: 'facil',
          minutes: 30,
          fix: 'Sirva a página por HTTPS e redirecione todo HTTP para HTTPS. Um certificado gratuito (Let\'s Encrypt) resolve. Nunca colete senha em página HTTP.',
          gain: 'Credenciais deixam de trafegar em texto claro.',
        }),
      );
    }

    if (passwordViaGet.length > 0) {
      issues.push(
        issue({
          id: 'prot-password-get',
          title: 'Formulário de senha enviando via GET',
          description:
            'Um formulário com campo de senha usa method="get". A senha vai parar na URL — registrada no histórico do navegador, nos logs do servidor e do proxy, e no cabeçalho Referer enviado a terceiros. É um vazamento de credenciais.',
          severity: 'high',
          impact: 'alto',
          difficulty: 'facil',
          minutes: 15,
          fix: 'Troque o método do formulário para POST. Senhas e dados sensíveis nunca devem ir na query string.',
          gain: 'A senha para de vazar em URLs, logs e cabeçalhos Referer.',
        }),
      );
    }

    if (actionToHttp.length > 0 && isHttps) {
      issues.push(
        issue({
          id: 'prot-password-action-http',
          title: 'Formulário de senha envia para destino HTTP',
          description:
            'A página é HTTPS, mas o formulário de login envia os dados para uma URL http:// — a proteção é anulada no envio, e a senha trafega em texto claro até o destino.',
          severity: 'critical',
          impact: 'alto',
          difficulty: 'facil',
          minutes: 15,
          fix: 'Aponte o action do formulário para uma URL https://. Verifique também redirecionamentos no destino que possam rebaixar para HTTP.',
          gain: 'Credenciais protegidas em todo o trajeto até o servidor.',
        }),
      );
    }

    // =====================================================================
    // 6. security.txt e listagem de diretórios
    // =====================================================================
    const sec = ctx.securityTxt;
    const secOk = Boolean(sec?.ok && /contact\s*:/i.test(sec.text));
    checks.push(check('security-txt', 'security.txt (política de divulgação)', secOk ? 1 : 0, 1, secOk ? 'presente' : 'ausente'));

    if (!secOk) {
      issues.push(
        issue({
          id: 'prot-no-security-txt',
          title: 'Sem security.txt (canal de divulgação de vulnerabilidades)',
          description:
            'Não há /.well-known/security.txt. Sem um canal claro, quem descobre uma falha no seu site não sabe como avisar — e uma vulnerabilidade que poderia ser corrigida discretamente acaba virando incidente público ou é vendida.',
          severity: 'low',
          impact: 'baixo',
          difficulty: 'facil',
          minutes: 15,
          fix:
            'Crie /.well-known/security.txt (RFC 9116) com pelo menos: uma linha "Contact: mailto:security@seudominio.com" e uma "Expires:" com data futura. Opcionalmente adicione "Policy:" apontando para sua política de divulgação.',
          gain: 'Pesquisadores passam a ter um caminho para reportar falhas de forma responsável.',
        }),
      );
    }

    const autoindex = /<title>Index of \/|<h1>Index of \/|Directory listing for \//i.test(html);
    checks.push(check('no-autoindex', 'Listagem de diretórios desabilitada', autoindex ? 0 : 1, 1, autoindex ? 'exposta' : 'ok'));

    if (autoindex) {
      issues.push(
        issue({
          id: 'prot-autoindex',
          title: 'Listagem de diretórios habilitada',
          description:
            'O servidor exibe o conteúdo de diretórios sem página de índice. Isso expõe arquivos que não deveriam ser navegáveis — backups, configs, uploads — dando ao atacante um mapa dos arquivos do servidor.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 10,
          fix: 'Desative a listagem automática (no nginx, `autoindex off;` — que já é o padrão; no Apache, remova `Options +Indexes`).',
          gain: 'Arquivos deixam de ser navegáveis sem um link explícito.',
        }),
      );
    }

    // =====================================================================
    // 7. Arquivos sensíveis acessíveis publicamente (.env, .git, dumps, backups)
    // =====================================================================
    // Sondagem feita no coletor: GET a caminhos conhecidos, confirmando por
    // assinatura de conteúdo que a resposta é MESMO o arquivo (e não um HTML de
    // fallback). Mesma natureza da busca por robots.txt/security.txt — nenhum
    // payload de ataque é enviado.
    const exposedFiles = ctx.exposedPaths ?? [];
    const criticalFiles = exposedFiles.filter((f) => f.severity === 'critical');
    checks.push(
      check(
        'no-exposed-files',
        'Sem arquivos sensíveis acessíveis',
        exposedFiles.length === 0 ? 1 : 0,
        3,
        exposedFiles.length > 0 ? `${exposedFiles.length} arquivo(s)` : 'ok',
      ),
    );

    if (exposedFiles.length > 0) {
      issues.push(
        issue({
          id: 'prot-exposed-file',
          title: `Arquivo sensível acessível publicamente: ${exposedFiles.map((f) => f.path).join(', ')}`,
          description:
            'Um ou mais arquivos que nunca deveriam ser públicos respondem diretamente pela web. Arquivos como .env, .git, dumps de banco ou backups de configuração entregam credenciais, chaves de API, strings de conexão — e, no caso do .git, o código-fonte completo do site. Qualquer visitante ou robô que peça a URL recebe o conteúdo; é uma das exposições mais visadas por varreduras automatizadas.',
          severity: criticalFiles.length > 0 ? 'critical' : 'high',
          impact: 'alto',
          difficulty: 'facil',
          minutes: 30,
          fix:
            'Passo a passo: (1) bloqueie o acesso a esses caminhos no servidor — no nginx, `location ~ /\\.(?!well-known) { deny all; }` cobre dotfiles como .env e .git; adicione regras negando *.sql, *.bak, *.old e *.save; (2) tire dumps e backups do diretório público (nunca devem ficar no docroot); (3) se um .env, chave ou credencial foi servido, trate-o como COMPROMETIDO: revogue e gere novas credenciais; (4) se o .git estava exposto, todo o histórico pode ter sido clonado — troque qualquer segredo que já passou pelo repositório.',
          gain: 'Fecha o acesso direto a credenciais, código-fonte e dados — a exposição de maior impacto e mais fácil de explorar.',
          evidence: exposedFiles.map(
            (f) => `${f.path} → HTTP ${f.status} (${f.label}${f.sizeBytes ? `, ${formatBytes(f.sizeBytes)}` : ''})`,
          ),
        }),
      );
    }

    return {
      score: scoreFromChecks(checks),
      checks,
      issues,
      recommendations,
      evidence: {
        methodology:
          'Detecção passiva — nenhum payload de ataque é enviado; a sondagem de arquivos usa apenas requisições GET a caminhos conhecidos.',
        exposedFiles: exposedFiles.map((f) => `${f.path} (${f.label}, HTTP ${f.status})`),
        wafDetected: [...detectedWafs],
        originProtected: hasProxy,
        originExposed,
        exposedOriginIps: exposedIps,
        cdnEdgeIps: cdnIps,
        publicIpv6,
        internalIpLeaks: [...new Set(leakedIps)],
        techDisclosure: disclosures,
        exposedSecrets: secretsFound.map((s) => `${s.name}: ${s.sample}`),
        hardcodedSecrets: [...genericHits],
        passwordForms: passwordForms.length,
        passwordTransportSecure: passwordForms.length === 0 || transportOk,
        sqlErrorLeaks: sqlLeaks,
        stackTraceExposed: stackTraces.length > 0,
        parameterizedUrls: paramLinks.map((l) => l.absolute),
        securityTxt: secOk,
        directoryListing: autoindex,
      },
    };
  },
};

export default plugin;
