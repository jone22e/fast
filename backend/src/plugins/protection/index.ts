import { scoreFromChecks } from '../../core/scoring.js';
import type { AuditContext, AuditPlugin, Check, PluginIssue } from '../../core/types.js';
import { check, issue } from '../helpers.js';

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

const plugin: AuditPlugin = {
  id: 'protection',
  name: 'Proteção & Exposição',
  description:
    'Avaliação passiva da postura de segurança: WAF/firewall, exposição do IP de origem, vazamento de tecnologia, sinais de suscetibilidade a SQL injection e política de divulgação.',
  category: 'protection',
  weight: 2.5,
  checks: [
    'WAF / firewall de aplicação',
    'CDN/proxy na frente da origem',
    'IP de origem não exposto',
    'Sem vazamento de IP interno em cabeçalhos',
    'Sem divulgação de versão/tecnologia',
    'Sem vazamento de erros de banco (SQLi)',
    'Sem stack traces expostos',
    'Superfície de parâmetros na URL',
    'Formulários sem parâmetros sensíveis em GET',
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

    // Detecção passiva CONFIRMA um WAF, mas não prova a ausência: muitos não
    // se identificam nos cabeçalhos. Por isso "não confirmado" vale 0,5 (inconclusivo),
    // nunca 0 — não penalizamos um site que pode ter proteção invisível.
    const hasWaf = detectedWafs.size > 0;
    const hasProxy = Boolean(ctx.network.cdn) || hasWaf;
    checks.push(check('waf', 'WAF / firewall de aplicação', hasWaf ? 1 : 0.5, 2, hasWaf ? [...detectedWafs].join(', ') : 'não confirmado (detecção passiva)'));

    if (!hasWaf) {
      issues.push(
        issue({
          id: 'prot-no-waf',
          title: 'WAF não confirmado',
          description:
            'Não foi identificado nenhum firewall de aplicação (WAF) nas respostas do site. A detecção é passiva e não vê todos os WAFs — alguns não se identificam —, então isto é um alerta, não uma certeza de ausência. O WAF é a primeira linha de defesa contra SQL injection, XSS e varreduras automatizadas: vale confirmar se existe um ativo.',
          severity: hasProxy ? 'low' : 'medium',
          impact: 'medio',
          difficulty: 'media',
          minutes: 60,
          fix:
            'Confirme se há um WAF ativo. Se não houver, Cloudflare e AWS WAF oferecem regras gerenciadas contra o OWASP Top 10, ativadas no DNS/CDN sem alterar a aplicação.',
          gain: 'Bloqueio automático da maioria dos ataques conhecidos antes de chegarem ao servidor.',
        }),
      );
    }

    // =====================================================================
    // 2. Exposição do IP de origem
    // =====================================================================
    // O IP que resolve para o host pode ser a origem OU um nó de borda —
    // passivamente não dá para distinguir. Então reportamos os IPs como fato
    // e, se não houver proxy detectado, levantamos um alerta CONDICIONAL.
    checks.push(check('origin-protected', 'CDN/proxy protegendo a origem', hasProxy ? 1 : 0.5, 1.5, ctx.network.cdn ?? (hasWaf ? [...detectedWafs].join(', ') : 'proxy não detectado')));

    if (!hasProxy && ctx.network.ipAddresses.length > 0) {
      issues.push(
        issue({
          id: 'prot-origin-exposed',
          title: 'Nenhum CDN/proxy detectado na frente do site',
          description:
            `Não foi detectado CDN nem WAF na frente do site. Os endereços que respondem publicamente por este host são ${ctx.network.ipAddresses.slice(0, 3).join(', ')}. Se algum deles for o servidor de origem (e não um nó de borda), ele recebe tráfego da internet diretamente, ficando exposto a DDoS, varredura de portas e ataques que contornariam qualquer proteção de borda.`,
          severity: 'medium',
          impact: 'medio',
          difficulty: 'media',
          minutes: 45,
          fix:
            'Se o IP acima for o da origem, coloque um CDN/proxy reverso na frente (Cloudflare, CloudFront, Fastly) e restrinja o firewall do servidor para aceitar HTTP/HTTPS apenas dos ranges do CDN — assim o IP de origem deixa de ser alcançável diretamente.',
          gain: 'A origem deixa de ser um alvo direto; ataques volumétricos são absorvidos na borda.',
          evidence: ctx.network.ipAddresses.slice(0, 5),
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
    // 5. security.txt e listagem de diretórios
    // =====================================================================
    const sec = ctx.securityTxt;
    const secOk = Boolean(sec?.ok && /contact\s*:/i.test(sec.text));
    checks.push(check('security-txt', 'security.txt (política de divulgação)', secOk ? 1 : 0.3, 1, secOk ? 'presente' : 'ausente'));

    if (!secOk) {
      recommendations.push(
        'Publique /.well-known/security.txt (RFC 9116) com um contato de segurança. Facilita a comunicação responsável de vulnerabilidades antes que virem incidente público.',
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

    return {
      score: scoreFromChecks(checks),
      checks,
      issues,
      recommendations,
      evidence: {
        methodology: 'Detecção passiva — nenhum payload de ataque é enviado ao site auditado.',
        wafDetected: [...detectedWafs],
        originProtected: hasProxy,
        originIps: ctx.network.ipAddresses,
        internalIpLeaks: [...new Set(leakedIps)],
        techDisclosure: disclosures,
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
