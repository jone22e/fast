import { scoreFromChecks } from '../../core/scoring.js';
import type { AuditContext, AuditPlugin, Check, PluginIssue } from '../../core/types.js';
import { check, issue } from '../helpers.js';

const plugin: AuditPlugin = {
  id: 'security',
  name: 'Segurança',
  description: 'HTTPS, certificado, cabeçalhos de segurança, política de cookies e conteúdo misto.',
  category: 'security',
  weight: 2.5,
  checks: [
    'HTTPS', 'Certificado válido', 'Validade do certificado', 'HSTS',
    'Content-Security-Policy', 'X-Frame-Options', 'Referrer-Policy',
    'Permissions-Policy', 'X-Content-Type-Options',
    'Cookies Secure', 'Cookies HttpOnly', 'SameSite', 'Mixed Content',
  ],

  async run(ctx: AuditContext) {
    const checks: Check[] = [];
    const issues: PluginIssue[] = [];
    const recommendations: string[] = [];
    const h = ctx.headers;
    const isHttps = ctx.finalUrl.startsWith('https://');

    // ---- HTTPS e certificado ---------------------------------------------
    checks.push(check('https', 'HTTPS habilitado', isHttps ? 1 : 0, 4, isHttps ? 'sim' : 'não'));

    if (!isHttps) {
      issues.push(
        issue({
          id: 'sec-no-https',
          title: 'Site servido sem HTTPS',
          description:
            'Todo o tráfego trafega em texto claro, podendo ser lido e alterado por qualquer intermediário. Navegadores marcam a página como "Não seguro" e buscadores penalizam o ranqueamento.',
          severity: 'critical',
          impact: 'alto',
          difficulty: 'media',
          minutes: 60,
          fix: 'Emita um certificado (Let\'s Encrypt é gratuito), configure o servidor para HTTPS e redirecione todo o tráfego HTTP para HTTPS com 301.',
          gain: 'Proteção dos dados, remoção do aviso de "Não seguro" e recuperação de posições no ranqueamento.',
        }),
      );
    }

    const tls = ctx.network.tls;
    checks.push(check('cert-valid', 'Certificado confiável', tls?.valid ? 1 : isHttps ? 0 : 0.5, 3, tls?.issuer ?? 'n/d'));

    const days = tls?.daysRemaining ?? null;
    checks.push(check('cert-expiry', 'Certificado longe do vencimento', days === null ? 0.5 : days > 30 ? 1 : days > 7 ? 0.5 : 0, 2, days !== null ? `${days} dias restantes` : 'n/d'));

    if (tls && !tls.valid && isHttps) {
      issues.push(
        issue({
          id: 'sec-invalid-cert',
          title: 'Certificado TLS inválido ou não confiável',
          description: 'O navegador exibirá um aviso de segurança em tela cheia antes de permitir o acesso, o que faz a maioria dos visitantes abandonar o site.',
          severity: 'critical',
          impact: 'alto',
          difficulty: 'media',
          minutes: 45,
          fix: 'Verifique se a cadeia de certificação intermediária está completa e se o certificado cobre o domínio acessado (incluindo o subdomínio www, se usado).',
          gain: 'Acesso sem avisos de segurança.',
          evidence: [`Emissor: ${tls.issuer ?? 'n/d'}`, `Assunto: ${tls.subject ?? 'n/d'}`, `Válido até: ${tls.validTo ?? 'n/d'}`],
        }),
      );
    }

    if (days !== null && days <= 30) {
      issues.push(
        issue({
          id: 'sec-cert-expiring',
          title: `Certificado expira em ${days} dia(s)`,
          description: 'Após o vencimento, todos os visitantes recebem um erro de segurança bloqueante.',
          severity: days <= 7 ? 'critical' : 'high',
          impact: 'alto',
          difficulty: 'facil',
          minutes: 20,
          fix: 'Renove o certificado e configure a renovação automática (certbot renew via systemd timer ou cron).',
          gain: 'Elimina o risco de indisponibilidade por certificado vencido.',
          evidence: [`Expira em: ${tls?.validTo ?? 'n/d'}`],
        }),
      );
    }

    // ---- Cabeçalhos de segurança -----------------------------------------
    const hsts = h['strict-transport-security'];
    const hstsMaxAge = hsts?.match(/max-age=(\d+)/)?.[1];
    const hstsOk = Boolean(hstsMaxAge && Number(hstsMaxAge) >= 15_552_000);
    checks.push(check('hsts', 'Strict-Transport-Security', hstsOk ? 1 : hsts ? 0.5 : 0, 2, hsts ?? 'ausente'));

    if (!hsts && isHttps) {
      issues.push(
        issue({
          id: 'sec-no-hsts',
          title: 'Cabeçalho HSTS ausente',
          description:
            'Sem HSTS, a primeira visita pode ser interceptada e rebaixada para HTTP antes do redirecionamento acontecer.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 10,
          fix: 'Adicione: Strict-Transport-Security: max-age=31536000; includeSubDomains. Só ative includeSubDomains se todos os subdomínios já usarem HTTPS.',
          gain: 'O navegador passa a forçar HTTPS sem esperar o redirecionamento.',
        }),
      );
    }

    const csp = h['content-security-policy'];
    const cspWeak = csp ? /unsafe-inline|unsafe-eval|\*\s*;|default-src\s+\*/i.test(csp) : false;
    checks.push(check('csp', 'Content-Security-Policy', csp ? (cspWeak ? 0.5 : 1) : 0, 2.5, csp ? (cspWeak ? 'presente, mas permissiva' : 'presente') : 'ausente'));

    if (!csp) {
      issues.push(
        issue({
          id: 'sec-no-csp',
          title: 'Sem Content-Security-Policy',
          description:
            'A CSP é a principal defesa contra XSS: ela declara de quais origens scripts, estilos e imagens podem ser carregados. Sem ela, qualquer script injetado executa livremente.',
          severity: 'high',
          impact: 'alto',
          difficulty: 'dificil',
          minutes: 180,
          fix:
            'Comece com Content-Security-Policy-Report-Only para mapear as origens legítimas, depois aplique em modo bloqueante. Uma base razoável: default-src \'self\'; script-src \'self\'; object-src \'none\'; base-uri \'self\'; frame-ancestors \'none\'.',
          gain: 'Mitigação da classe mais comum de vulnerabilidade web.',
        }),
      );
    } else if (cspWeak) {
      issues.push(
        issue({
          id: 'sec-weak-csp',
          title: 'Content-Security-Policy permissiva demais',
          description: 'A política contém unsafe-inline, unsafe-eval ou curingas, o que anula grande parte da proteção contra XSS.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'dificil',
          minutes: 120,
          fix: 'Substitua unsafe-inline por nonces ou hashes por script, e remova unsafe-eval refatorando código que usa eval() ou new Function().',
          gain: 'CSP efetivamente bloqueante contra injeção de scripts.',
          evidence: [csp.slice(0, 300)],
        }),
      );
    }

    const xfo = h['x-frame-options'];
    const frameAncestors = csp?.includes('frame-ancestors');
    checks.push(check('xfo', 'Proteção contra clickjacking', xfo || frameAncestors ? 1 : 0, 1.5, xfo ?? (frameAncestors ? 'via CSP frame-ancestors' : 'ausente')));

    if (!xfo && !frameAncestors) {
      issues.push(
        issue({
          id: 'sec-no-xfo',
          title: 'Sem proteção contra clickjacking',
          description: 'A página pode ser embutida em um iframe em site de terceiros e sobreposta com elementos invisíveis para capturar cliques do usuário.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 10,
          fix: 'Adicione X-Frame-Options: SAMEORIGIN, e preferencialmente também frame-ancestors \'self\' na CSP.',
          gain: 'Elimina o vetor de clickjacking.',
        }),
      );
    }

    const xcto = h['x-content-type-options'];
    checks.push(check('xcto', 'X-Content-Type-Options: nosniff', xcto?.toLowerCase() === 'nosniff' ? 1 : 0, 1, xcto ?? 'ausente'));

    const referrer = h['referrer-policy'];
    checks.push(check('referrer', 'Referrer-Policy', referrer ? 1 : 0, 1, referrer ?? 'ausente'));

    const permissions = h['permissions-policy'] ?? h['feature-policy'];
    checks.push(check('permissions', 'Permissions-Policy', permissions ? 1 : 0, 1, permissions ?? 'ausente'));

    const missingMinor = [
      !xcto && 'X-Content-Type-Options',
      !referrer && 'Referrer-Policy',
      !permissions && 'Permissions-Policy',
    ].filter(Boolean) as string[];

    if (missingMinor.length >= 2) {
      issues.push(
        issue({
          id: 'sec-missing-headers',
          title: `${missingMinor.length} cabeçalhos de segurança ausentes`,
          description: `Faltam: ${missingMinor.join(', ')}. São proteções de baixo custo contra sniffing de MIME, vazamento de referrer e uso indevido de APIs do navegador.`,
          severity: 'low',
          impact: 'baixo',
          difficulty: 'facil',
          minutes: 15,
          fix:
            'Adicione no servidor: X-Content-Type-Options: nosniff; Referrer-Policy: strict-origin-when-cross-origin; Permissions-Policy: geolocation=(), microphone=(), camera=().',
          gain: 'Superfície de ataque reduzida com uma única alteração de configuração.',
          evidence: missingMinor,
        }),
      );
    }

    // ---- Cookies ----------------------------------------------------------
    const cookies = ctx.cookies;
    const insecure = cookies.filter((c) => !c.secure);
    const noHttpOnly = cookies.filter((c) => !c.httpOnly);
    const noSameSite = cookies.filter((c) => !c.sameSite || c.sameSite === 'None');

    checks.push(check('cookie-secure', 'Cookies com flag Secure', cookies.length === 0 ? 1 : 1 - insecure.length / cookies.length, 1.5, `${insecure.length}/${cookies.length} sem Secure`));
    checks.push(check('cookie-httponly', 'Cookies com HttpOnly', cookies.length === 0 ? 1 : 1 - noHttpOnly.length / cookies.length, 1, `${noHttpOnly.length}/${cookies.length} sem HttpOnly`));
    checks.push(check('cookie-samesite', 'Cookies com SameSite', cookies.length === 0 ? 1 : 1 - noSameSite.length / cookies.length, 1, `${noSameSite.length}/${cookies.length} sem SameSite`));

    if (insecure.length > 0 && isHttps) {
      issues.push(
        issue({
          id: 'sec-insecure-cookies',
          title: `${insecure.length} cookie(s) sem a flag Secure`,
          description: 'Cookies sem Secure são enviados também em conexões HTTP, expondo sessões a interceptação.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 20,
          fix: 'Defina os cookies com as flags Secure, HttpOnly e SameSite=Lax (ou Strict quando não houver navegação cross-site legítima).',
          gain: 'Sessões protegidas contra interceptação e roubo por script.',
          evidence: insecure.slice(0, 8).map((c) => `${c.name} (${c.domain})`),
        }),
      );
    }

    // ---- Conteúdo misto ---------------------------------------------------
    const mixedContent = isHttps ? ctx.resources.filter((r) => r.url.startsWith('http://')) : [];
    checks.push(check('mixed-content', 'Sem conteúdo misto', mixedContent.length === 0 ? 1 : 0, 2.5, `${mixedContent.length} recurso(s) via HTTP`));

    if (mixedContent.length > 0) {
      issues.push(
        issue({
          id: 'sec-mixed-content',
          title: `${mixedContent.length} recurso(s) carregado(s) via HTTP em página HTTPS`,
          description:
            'Navegadores bloqueiam scripts e folhas de estilo em HTTP dentro de páginas HTTPS, e marcam a conexão como parcialmente insegura. Recursos podem simplesmente não carregar.',
          severity: 'high',
          impact: 'alto',
          difficulty: 'facil',
          minutes: 30,
          fix: 'Troque todas as URLs http:// por https:// (ou por caminhos relativos ao protocolo). Adicione upgrade-insecure-requests à CSP como rede de segurança.',
          gain: 'Conexão totalmente segura e todos os recursos carregando corretamente.',
          evidence: mixedContent.slice(0, 8).map((r) => r.url.slice(0, 120)),
        }),
      );
    }

    // ---- Exposição de versão ---------------------------------------------
    const server = h['server'] ?? '';
    const poweredBy = h['x-powered-by'];
    const leaksVersion = /\d+\.\d+/.test(server) || Boolean(poweredBy);
    checks.push(check('version-disclosure', 'Sem exposição de versão do servidor', leaksVersion ? 0.3 : 1, 0.5, poweredBy ?? server ?? 'oculto'));

    if (leaksVersion) {
      recommendations.push(
        `O servidor expõe versão (${[server, poweredBy].filter(Boolean).join(', ')}). Oculte com server_tokens off no nginx e remova o X-Powered-By na aplicação.`,
      );
    }

    return {
      score: scoreFromChecks(checks),
      checks,
      issues,
      recommendations,
      evidence: {
        https: isHttps,
        tls,
        headers: {
          'strict-transport-security': hsts ?? null,
          'content-security-policy': csp ?? null,
          'x-frame-options': xfo ?? null,
          'x-content-type-options': xcto ?? null,
          'referrer-policy': referrer ?? null,
          'permissions-policy': permissions ?? null,
        },
        cookies,
        mixedContent: mixedContent.map((r) => r.url).slice(0, 20),
      },
    };
  },
};

export default plugin;
