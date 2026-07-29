import { scoreFromChecks } from '../../core/scoring.js';
import type { AuditContext, AuditPlugin, Check, PluginIssue } from '../../core/types.js';
import { check, issue } from '../helpers.js';

/**
 * Módulo LGPD — conformidade observável de fora.
 *
 * O que este módulo é: uma verificação técnica do que o site revela a quem
 * apenas o visita. Cookies e rastreadores que disparam antes de qualquer
 * consentimento, política de privacidade publicada, encarregado identificado,
 * formulários que coletam dado pessoal.
 *
 * O que ele NÃO é: uma avaliação jurídica. Base legal adequada, registro das
 * operações, contratos com operadores, relatório de impacto — nada disso é
 * observável de fora, e nenhuma nota aqui substitui a análise de um advogado.
 * Os textos dos problemas dizem isso explicitamente.
 *
 * A régua principal é o momento do disparo: a auditoria carrega a página e não
 * clica em nada. Tudo que for definido nesse instante foi definido SEM
 * consentimento — que é exatamente a situação que a ANPD tem cobrado.
 */

/** Cookies de rastreamento conhecidos, por prefixo ou nome exato. */
const TRACKING_COOKIES: { re: RegExp; origem: string }[] = [
  { re: /^_ga($|_)/, origem: 'Google Analytics' },
  { re: /^_gid$|^_gat/, origem: 'Google Analytics' },
  { re: /^_gcl_/, origem: 'Google Ads' },
  { re: /^_fbp$|^_fbc$/, origem: 'Meta Pixel' },
  { re: /^_hj/, origem: 'Hotjar' },
  { re: /^_clck$|^_clsk$/, origem: 'Microsoft Clarity' },
  { re: /^_uetsid|^_uetvid/, origem: 'Microsoft Ads' },
  { re: /^_tt_/, origem: 'TikTok Pixel' },
  { re: /^_pin_/, origem: 'Pinterest' },
  { re: /^li_|^lidc$|^bcookie$/, origem: 'LinkedIn' },
  { re: /^IDE$|^test_cookie$/, origem: 'DoubleClick' },
  { re: /^__utm/, origem: 'Google Analytics (legado)' },
  { re: /^_rdtrk|^rdtrk/, origem: 'RD Station' },
  { re: /^mp_/, origem: 'Mixpanel' },
  { re: /^ajs_/, origem: 'Segment' },
  { re: /^amplitude_/, origem: 'Amplitude' },
];

/** Domínios de rastreamento carregados pela página. */
const TRACKING_HOSTS: { re: RegExp; origem: string }[] = [
  { re: /google-analytics\.com|analytics\.google\.com/, origem: 'Google Analytics' },
  { re: /googletagmanager\.com/, origem: 'Google Tag Manager' },
  { re: /connect\.facebook\.net|facebook\.com\/tr/, origem: 'Meta Pixel' },
  { re: /static\.hotjar\.com|script\.hotjar\.com/, origem: 'Hotjar' },
  { re: /clarity\.ms/, origem: 'Microsoft Clarity' },
  { re: /doubleclick\.net/, origem: 'DoubleClick' },
  { re: /analytics\.tiktok\.com/, origem: 'TikTok' },
  { re: /snap\.licdn\.com|ads\.linkedin\.com/, origem: 'LinkedIn Ads' },
  { re: /bat\.bing\.com/, origem: 'Microsoft Ads' },
  { re: /criteo\.(com|net)/, origem: 'Criteo' },
  { re: /taboola\.com|outbrain\.com/, origem: 'Recomendação de conteúdo' },
  { re: /hs-scripts\.com|hubspot\.com/, origem: 'HubSpot' },
  { re: /d335luupugsy2\.cloudfront\.net|rdstation/, origem: 'RD Station' },
  { re: /mixpanel\.com/, origem: 'Mixpanel' },
  { re: /cdn\.segment\.com/, origem: 'Segment' },
  { re: /amplitude\.com/, origem: 'Amplitude' },
];

/** Cookies que sustentam a própria navegação — dispensam consentimento. */
const ESSENTIAL_COOKIE = /^(sess|phpsessid|jsessionid|asp\.net|csrf|xsrf|__cf|cf_|__host-|__secure-|laravel_session|connect\.sid|wordpress_|wp-|woocommerce_|_shopify|remember_)/i;

const POLICY_HINT = /pol[ií]tica.{0,20}privacidade|privacy.{0,10}policy|aviso.{0,10}privacidade|privacidade/i;
const TERMS_HINT = /termos?.{0,20}(uso|servi[çc]o)|terms.{0,10}(of.{0,5})?(use|service)/i;

/** Marcadores de que a política realmente fala de LGPD. */
const LGPD_TERMS = [
  { key: 'LGPD ou Lei 13.709', re: /lgpd|lei\s*n?[º°]?\s*13\.?709/i },
  { key: 'titular dos dados', re: /titular(es)?\s+d(os|e)\s+dados|data subject/i },
  { key: 'base legal ou finalidade', re: /base\s+legal|finalidade\s+d(o|e)\s+tratamento|leg[ií]tim[oa]\s+interesse/i },
  { key: 'direitos do titular', re: /direitos?\s+d(o|os)\s+titular|solicitar\s+a\s+exclus[ãa]o|revogar\s+o?\s*consentimento/i },
  { key: 'encarregado (DPO)', re: /encarregad[oa]|data\s+protection\s+officer|\bdpo\b/i },
];

const DPO_CONTACT = /encarregad[oa][^.]{0,80}?([\w.+-]+@[\w.-]+\.\w+)|\b(dpo|privacidade|protecaodedados|dataprivacy)@[\w.-]+\.\w+/i;

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

const plugin: AuditPlugin = {
  id: 'lgpd',
  name: 'LGPD',
  description:
    'Conformidade observável com a Lei Geral de Proteção de Dados: consentimento antes do rastreamento, cookies definidos sem autorização, política de privacidade, encarregado (DPO) e formulários de coleta.',
  category: 'lgpd',
  checks: [
    'banner de consentimento', 'rastreadores antes do consentimento', 'cookies antes do consentimento',
    'validade dos cookies', 'cookies de terceiros', 'política de privacidade', 'conteúdo da política',
    'encarregado (DPO)', 'termos de uso', 'formulários de coleta',
  ],
  weight: 2.5,

  async run(ctx: AuditContext) {
    const checks: Check[] = [];
    const issues: PluginIssue[] = [];
    const d = ctx.dom;
    const siteHost = hostOf(ctx.finalUrl);

    // ---- 1. Banner de consentimento ---------------------------------------
    const hasBanner = d.consentBanner;
    checks.push(
      check('consent-banner', 'Banner de consentimento presente', hasBanner ? 1 : 0, 2,
        d.cmp ?? (hasBanner ? 'presente' : 'ausente')),
    );
    checks.push(check('cmp', 'Plataforma de consentimento identificada', d.cmp ? 1 : 0.5, 0.5, d.cmp ?? 'não detectada'));

    // ---- 2. Rastreadores disparados antes de qualquer interação -----------
    // A auditoria não clica em nada: o que carregou, carregou sem consentimento.
    const trackers = [
      ...new Set(
        ctx.resources
          .map((r) => TRACKING_HOSTS.find((t) => t.re.test(r.url))?.origem)
          .filter((name): name is string => Boolean(name)),
      ),
    ];

    checks.push(
      check('no-tracking-before-consent', 'Sem rastreadores antes do consentimento',
        trackers.length === 0 ? 1 : 0, 3, `${trackers.length} rastreador(es)`),
    );

    // ---- 3. Cookies definidos antes do consentimento ----------------------
    const nonEssential = ctx.cookies.filter((c) => !ESSENTIAL_COOKIE.test(c.name));
    const trackingCookies = nonEssential
      .map((c) => ({ cookie: c, origem: TRACKING_COOKIES.find((t) => t.re.test(c.name))?.origem }))
      .filter((c) => c.origem);

    checks.push(
      check('no-cookies-before-consent', 'Sem cookies não essenciais antes do consentimento',
        trackingCookies.length === 0 ? 1 : 0, 3, `${trackingCookies.length} cookie(s)`),
    );

    // ---- 4. Validade dos cookies ------------------------------------------
    // 13 meses é a referência prática de "prazo razoável" para consentimento.
    const maxSeconds = 13 * 30 * 24 * 3600;
    const now = Date.now() / 1000;
    const longLived = nonEssential.filter((c) => c.expires > 0 && c.expires - now > maxSeconds);
    checks.push(
      check('cookie-expiry', 'Cookies com prazo razoável',
        nonEssential.length === 0 ? 1 : 1 - longLived.length / nonEssential.length, 1,
        `${longLived.length} acima de 13 meses`),
    );

    // ---- 5. Cookies de terceiros ------------------------------------------
    const thirdParty = ctx.cookies.filter((c) => {
      const domain = c.domain.replace(/^\./, '').replace(/^www\./, '');
      return domain !== siteHost && !siteHost.endsWith(`.${domain}`) && !domain.endsWith(`.${siteHost}`);
    });
    checks.push(
      check('third-party-cookies', 'Poucos cookies de terceiros',
        ctx.cookies.length === 0 ? 1 : 1 - Math.min(1, thirdParty.length / 5), 1,
        `${thirdParty.length} de terceiros`),
    );

    // ---- 6. Política de privacidade ---------------------------------------
    const policyLink = d.links.find(
      (l) => POLICY_HINT.test(l.text) || POLICY_HINT.test(l.href) || POLICY_HINT.test(l.absolute),
    );
    checks.push(check('privacy-policy', 'Política de privacidade acessível', policyLink ? 1 : 0, 3,
      policyLink ? 'presente' : 'ausente'));

    // ---- 7. Conteúdo da política ------------------------------------------
    // Uma única busca da página da política — o custo de rede se paga: sem ler
    // o texto, só dá para dizer que existe um link, não que ele cumpre a lei.
    let policyText = '';
    let policyStatus = 0;
    if (policyLink?.absolute) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(policyLink.absolute, { redirect: 'follow', signal: controller.signal });
        clearTimeout(timer);
        policyStatus = res.status;
        if (res.ok) policyText = (await res.text()).slice(0, 400_000);
      } catch {
        policyStatus = 0;
      }
    }

    const haystack = `${policyText} ${d.text}`;
    const foundTerms = LGPD_TERMS.filter((t) => t.re.test(haystack));
    const missingTerms = LGPD_TERMS.filter((t) => !t.re.test(haystack)).map((t) => t.key);

    checks.push(
      check('policy-lgpd-terms', 'Política cita a LGPD e os direitos do titular',
        policyLink ? foundTerms.length / LGPD_TERMS.length : 0, 2,
        `${foundTerms.length}/${LGPD_TERMS.length} marcadores`),
    );

    // ---- 8. Encarregado (DPO) ---------------------------------------------
    // Três situações distintas: contato direto (o ideal), menção ao encarregado
    // sem contato — comum quando a empresa usa um formulário — e silêncio. Só o
    // silêncio vira problema; a menção sem contato fica com nota parcial.
    const dpoContact = haystack.match(DPO_CONTACT);
    const dpoMentioned = /encarregad[oa]|data\s+protection\s+officer|\bdpo\b/i.test(haystack);

    checks.push(
      check('dpo-contact', 'Encarregado (DPO) identificado',
        dpoContact ? 1 : dpoMentioned ? 0.5 : 0, 2,
        dpoContact ? 'com contato direto' : dpoMentioned ? 'citado, sem contato' : 'não identificado'),
    );

    // ---- 9. Termos de uso --------------------------------------------------
    const termsLink = d.links.find((l) => TERMS_HINT.test(l.text) || TERMS_HINT.test(l.href));
    checks.push(check('terms', 'Termos de uso publicados', termsLink ? 1 : 0.5, 0.5,
      termsLink ? 'presente' : 'ausente'));

    // ---- 10. Formulários que coletam dado pessoal --------------------------
    const collecting = d.forms.filter((f) => f.personalFields.length > 0 && !f.hasPassword);
    const withoutNotice = collecting.filter((f) => !f.hasConsentCheckbox && !f.hasPrivacyLink);
    const byGet = collecting.filter((f) => f.method === 'get');
    const toHttp = collecting.filter((f) => (f.action ?? '').startsWith('http://'));

    checks.push(
      check('form-notice', 'Formulários com aviso de privacidade',
        collecting.length === 0 ? 1 : 1 - withoutNotice.length / collecting.length, 1.5,
        collecting.length === 0 ? 'sem coleta' : `${withoutNotice.length} sem aviso`),
    );
    checks.push(
      check('form-method', 'Dado pessoal não trafega na URL',
        byGet.length === 0 ? 1 : 0, 1.5, `${byGet.length} via GET`),
    );
    checks.push(
      check('form-https', 'Formulários enviam por HTTPS',
        toHttp.length === 0 ? 1 : 0, 2, `${toHttp.length} para HTTP`),
    );

    // ---- Problemas ---------------------------------------------------------
    if (trackers.length > 0 && !hasBanner) {
      issues.push(
        issue({
          id: 'lgpd-tracking-no-consent',
          title: `${trackers.length} rastreador(es) carregado(s) sem consentimento`,
          description:
            'A página dispara rastreadores assim que abre, sem pedir autorização e sem oferecer recusa. Como a auditoria não clicou em nada, esse carregamento aconteceu sem qualquer manifestação do visitante — a situação que a ANPD tem tratado como tratamento de dados sem base legal adequada. Cada rastreador envia a terceiros o endereço visitado, o IP e um identificador persistente.',
          severity: 'high',
          impact: 'alto',
          difficulty: 'media',
          minutes: 240,
          fix: 'Adote uma plataforma de consentimento e mantenha as tags bloqueadas até a escolha do visitante. No Google Tag Manager, use o modo de consentimento (Consent Mode v2) com todos os sinais negados por padrão e dispare as tags apenas depois do aceite. O banner precisa oferecer recusar tão fácil quanto aceitar.',
          gain: 'Tratamento de dados apoiado em consentimento válido e risco de sanção da ANPD substancialmente reduzido.',
          evidence: trackers,
        }),
      );
    }

    if (trackingCookies.length > 0) {
      issues.push(
        issue({
          id: 'lgpd-cookies-no-consent',
          title: `${trackingCookies.length} cookie(s) de rastreamento definido(s) sem consentimento`,
          description:
            'Cookies de análise e publicidade foram gravados no navegador logo no primeiro acesso, antes de qualquer escolha. Cookies estritamente necessários dispensam consentimento; os de medição e marketing, não.',
          severity: 'high',
          impact: 'alto',
          difficulty: 'media',
          minutes: 180,
          fix: 'Classifique cada cookie em necessário, estatístico e de marketing. Grave apenas os necessários antes do aceite e condicione os demais à categoria correspondente no banner. Documente a lista na política de privacidade.',
          gain: 'Cookies não essenciais passam a depender de escolha informada, como a lei exige.',
          evidence: trackingCookies.map((c) => `${c.cookie.name} — ${c.origem}`),
        }),
      );
    }

    if (!hasBanner && (trackers.length > 0 || trackingCookies.length > 0)) {
      issues.push(
        issue({
          id: 'lgpd-no-consent-banner',
          title: 'Sem mecanismo de consentimento de cookies',
          description:
            'Não foi encontrado banner ou painel que permita aceitar, recusar ou configurar o uso de cookies. Sem ele, não há como demonstrar consentimento nem atender a um pedido de revogação — e a demonstração é obrigação do controlador.',
          severity: 'high',
          impact: 'alto',
          difficulty: 'media',
          minutes: 180,
          fix: 'Implante um banner com três ações no mesmo nível de destaque: aceitar, recusar e configurar. Guarde o registro da escolha (data, versão da política e opções) e ofereça um link permanente para rever a decisão.',
          gain: 'Passa a existir prova do consentimento e um caminho claro para revogá-lo.',
        }),
      );
    }

    if (!policyLink) {
      issues.push(
        issue({
          id: 'lgpd-no-privacy-policy',
          title: 'Política de privacidade não encontrada',
          description:
            'Nenhum link para política ou aviso de privacidade foi localizado nas páginas analisadas. A LGPD exige informar de forma clara e acessível quais dados são tratados, com que finalidade, com quem são compartilhados e por quanto tempo são mantidos.',
          severity: 'high',
          impact: 'alto',
          difficulty: 'media',
          minutes: 240,
          fix: 'Publique a política em URL fixa e enlace-a no rodapé de todas as páginas. Descreva: dados coletados, finalidade e base legal de cada tratamento, compartilhamento com terceiros, prazo de retenção, direitos do titular e como exercê-los, além do contato do encarregado.',
          gain: 'Transparência exigida pela lei e um canal claro para o titular exercer seus direitos.',
        }),
      );
    } else if (policyStatus >= 400 || policyStatus === 0) {
      issues.push(
        issue({
          id: 'lgpd-policy-unreachable',
          title: 'Política de privacidade inacessível',
          description:
            'O link para a política existe, mas a página não respondeu como esperado. Uma política que não abre equivale, na prática, a não ter política.',
          severity: 'medium',
          impact: 'alto',
          difficulty: 'facil',
          minutes: 30,
          fix: 'Corrija o destino do link e confirme que a página responde 200 sem exigir login.',
          gain: 'A política volta a cumprir sua função de informar o titular.',
          evidence: [`HTTP ${policyStatus || 'sem resposta'} — ${policyLink.absolute.slice(0, 110)}`],
        }),
      );
    } else if (missingTerms.length >= 3) {
      issues.push(
        issue({
          id: 'lgpd-policy-incomplete',
          title: 'Política de privacidade sem os elementos da LGPD',
          description:
            'A política existe, mas não traz os elementos que a lei espera encontrar. Faltam referências a: ' +
            missingTerms.join(', ') +
            '. Um texto genérico traduzido de outra jurisdição costuma deixar de fora justamente o que a LGPD exige.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'media',
          minutes: 180,
          fix: 'Revise a política cobrindo cada ponto: menção expressa à Lei 13.709/2018, finalidade e base legal de cada tratamento, direitos do titular (art. 18) e como exercê-los, prazo de retenção e identificação do encarregado.',
          gain: 'Política alinhada ao que a ANPD verifica, e menos exposição em uma eventual fiscalização.',
          evidence: missingTerms,
        }),
      );
    }

    if (!dpoMentioned) {
      issues.push(
        issue({
          id: 'lgpd-no-dpo',
          title: 'Encarregado (DPO) não identificado',
          description:
            'Não há indicação de quem é o encarregado pelo tratamento de dados nem de um canal para contatá-lo. A LGPD (art. 41) determina que a identidade e o contato do encarregado sejam divulgados publicamente, e é por esse canal que titular e ANPD se comunicam com a empresa.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 45,
          fix: 'Publique na política de privacidade o nome (ou a área responsável) e um e-mail de contato do encarregado — por exemplo encarregado@seudominio.com. Garanta que alguém acompanhe essa caixa.',
          gain: 'Cumprimento do art. 41 e um canal formal para pedidos de titulares.',
        }),
      );
    }

    if (withoutNotice.length > 0) {
      issues.push(
        issue({
          id: 'lgpd-form-no-notice',
          title: `${withoutNotice.length} formulário(s) coletam dados sem aviso de privacidade`,
          description:
            'Formulários pedem dados pessoais sem nenhuma caixa de consentimento nem link para a política ao lado. O titular precisa saber, no momento da coleta, para que os dados serão usados.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 60,
          fix: 'Acrescente ao formulário uma frase curta com o link da política ("Ao enviar, você concorda com a nossa Política de Privacidade") e, quando a base legal for o consentimento, uma caixa de marcação desmarcada por padrão.',
          gain: 'Coleta informada e prova de que o titular foi avisado.',
          evidence: withoutNotice.map((f) => `${f.method.toUpperCase()} ${f.action ?? '(mesma página)'} — campos: ${f.personalFields.join(', ')}`),
        }),
      );
    }

    if (byGet.length > 0) {
      issues.push(
        issue({
          id: 'lgpd-form-get',
          title: `${byGet.length} formulário(s) enviam dado pessoal na URL`,
          description:
            'Um formulário com campos pessoais usa method="get": nome, e-mail ou CPF vão parar na barra de endereço, no histórico do navegador, nos logs do servidor e no cabeçalho Referer enviado a terceiros. É vazamento de dado pessoal por desenho.',
          severity: 'high',
          impact: 'alto',
          difficulty: 'facil',
          minutes: 20,
          fix: 'Troque o método do formulário para POST. Dados pessoais nunca devem trafegar na query string.',
          gain: 'Os dados param de ser registrados em logs e históricos fora do seu controle.',
          evidence: byGet.map((f) => `${f.action ?? '(mesma página)'} — campos: ${f.personalFields.join(', ')}`),
        }),
      );
    }

    if (toHttp.length > 0) {
      issues.push(
        issue({
          id: 'lgpd-form-http',
          title: 'Formulário de dados pessoais envia por HTTP',
          description:
            'O destino do formulário usa http://, então os dados preenchidos trafegam em texto claro até o servidor. Qualquer intermediário na rede lê o conteúdo — a LGPD exige medidas técnicas capazes de proteger os dados de acessos não autorizados.',
          severity: 'critical',
          impact: 'alto',
          difficulty: 'facil',
          minutes: 30,
          fix: 'Aponte o action para uma URL https:// e confirme que o destino não redireciona para HTTP.',
          gain: 'Dados pessoais protegidos em trânsito, como a lei exige.',
          evidence: toHttp.map((f) => f.action ?? ''),
        }),
      );
    }

    if (longLived.length > 0) {
      issues.push(
        issue({
          id: 'lgpd-cookie-long-lived',
          title: `${longLived.length} cookie(s) com validade acima de 13 meses`,
          description:
            'Cookies não essenciais com prazo muito longo mantêm o visitante identificado por anos sem nova manifestação. O princípio da necessidade pede o menor prazo que ainda cumpra a finalidade; 13 meses é a referência prática para renovar o consentimento.',
          severity: 'low',
          impact: 'baixo',
          difficulty: 'facil',
          minutes: 30,
          fix: 'Reduza o max-age dos cookies de análise e marketing para até 13 meses e volte a pedir consentimento ao expirar.',
          gain: 'Retenção proporcional à finalidade e consentimento renovado periodicamente.',
          evidence: longLived.slice(0, 6).map((c) => `${c.name} — ${Math.round((c.expires - now) / 86400)} dias`),
        }),
      );
    }

    return {
      score: scoreFromChecks(checks),
      checks,
      issues,
      recommendations: [],
      evidence: {
        cmp: d.cmp,
        consentBanner: hasBanner,
        trackers,
        trackingCookies: trackingCookies.map((c) => c.cookie.name),
        thirdPartyCookies: thirdParty.length,
        policyUrl: policyLink?.absolute ?? null,
        policyStatus,
        lgpdTermsFound: foundTerms.map((t) => t.key),
        dpoIdentified: Boolean(dpoContact),
        dpoMentioned,
        collectingForms: collecting.length,
      },
    };
  },
};

export default plugin;
