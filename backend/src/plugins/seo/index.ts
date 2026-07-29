import { scoreFromChecks } from '../../core/scoring.js';
import type { AuditContext, AuditPlugin, Check, PluginIssue } from '../../core/types.js';
import { check, issue } from '../helpers.js';

const MAX_LINK_CHECKS = 25;

/** Verifica um lote de links, com timeout curto por requisição. */
async function checkLinks(urls: string[]): Promise<{ url: string; status: number }[]> {
  const results = await Promise.all(
    urls.map(async (url) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
        // Alguns servidores não implementam HEAD corretamente.
        if (res.status === 405 || res.status === 501) {
          res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal });
        }
        return { url, status: res.status };
      } catch {
        return { url, status: 0 };
      } finally {
        clearTimeout(timer);
      }
    }),
  );
  return results;
}

const plugin: AuditPlugin = {
  id: 'seo',
  name: 'SEO Tradicional',
  description: 'Tags de HTML, hierarquia de headings, links, sitemap, robots.txt e cartões sociais.',
  category: 'seo',
  weight: 3,
  checks: [
    'title', 'meta description', 'canonical', 'meta robots', 'viewport', 'charset',
    'H1 único', 'Hierarquia de headings', 'Headings vazios',
    'Links internos', 'Links externos', 'Links quebrados', 'Redirecionamentos',
    'sitemap.xml', 'Sitemap index', 'URLs inválidas no sitemap',
    'robots.txt', 'Regras de bloqueio',
    'og:title', 'og:image', 'og:url', 'og:type',
    'twitter:card', 'twitter:title', 'twitter:image',
  ],

  async run(ctx: AuditContext) {
    const checks: Check[] = [];
    const issues: PluginIssue[] = [];
    const recommendations: string[] = [];
    const d = ctx.dom;

    // ---- HTML básico ------------------------------------------------------
    const titleLen = d.title?.length ?? 0;
    const titleOk = titleLen >= 30 && titleLen <= 65;
    checks.push(check('title', 'Title presente e no tamanho ideal', d.title ? (titleOk ? 1 : 0.5) : 0, 3, d.title ? `${titleLen} caracteres` : 'ausente'));

    if (!d.title) {
      issues.push(
        issue({
          id: 'seo-no-title',
          title: 'Página sem tag <title>',
          description: 'O título é o principal sinal de relevância para buscadores e o texto exibido nos resultados de busca.',
          severity: 'critical',
          impact: 'alto',
          difficulty: 'facil',
          minutes: 5,
          fix: 'Adicione <title> no <head> com 30 a 65 caracteres, contendo a palavra-chave principal e a marca.',
          gain: 'Requisito básico para indexação e CTR nos resultados de busca.',
        }),
      );
    } else if (!titleOk) {
      issues.push(
        issue({
          id: 'seo-title-length',
          title: `Title com ${titleLen} caracteres`,
          description:
            titleLen < 30
              ? 'Títulos muito curtos desperdiçam espaço nos resultados e transmitem pouco contexto.'
              : 'Títulos longos são truncados nos resultados de busca, escondendo informação relevante.',
          severity: 'low',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 10,
          fix: 'Reescreva o título com 30 a 65 caracteres, começando pelo termo mais relevante.',
          gain: 'Maior taxa de clique nos resultados de busca.',
          evidence: [d.title],
        }),
      );
    }

    const descLen = d.metaDescription?.length ?? 0;
    const descOk = descLen >= 70 && descLen <= 165;
    checks.push(check('description', 'Meta description', d.metaDescription ? (descOk ? 1 : 0.5) : 0, 2, d.metaDescription ? `${descLen} caracteres` : 'ausente'));

    if (!d.metaDescription) {
      issues.push(
        issue({
          id: 'seo-no-description',
          title: 'Meta description ausente',
          description: 'Sem descrição, o buscador monta um trecho automático a partir do conteúdo, geralmente menos persuasivo.',
          severity: 'high',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 10,
          fix: 'Adicione <meta name="description" content="..."> com 70 a 165 caracteres resumindo a proposta da página.',
          gain: 'Aumento típico de 5% a 15% na taxa de clique.',
        }),
      );
    }

    checks.push(check('canonical', 'URL canônica declarada', d.canonical ? 1 : 0, 2, d.canonical ?? 'ausente'));
    if (!d.canonical) {
      issues.push(
        issue({
          id: 'seo-no-canonical',
          title: 'Sem link canônico',
          description: 'Sem canonical, variações de URL (com parâmetros, com/sem barra final) podem ser tratadas como páginas duplicadas.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 10,
          fix: 'Adicione <link rel="canonical" href="URL absoluta preferida"> no <head> de cada página.',
          gain: 'Consolidação da autoridade em uma única URL.',
        }),
      );
    }

    const noindex = (d.robotsMeta ?? '').toLowerCase().includes('noindex');
    checks.push(check('robots-meta', 'Meta robots permite indexação', noindex ? 0 : 1, 3, d.robotsMeta ?? 'padrão (index, follow)'));
    if (noindex) {
      issues.push(
        issue({
          id: 'seo-noindex',
          title: 'Página marcada como noindex',
          description: 'A meta robots instrui os buscadores a não indexar esta página. Se não for intencional, ela está invisível nas buscas.',
          severity: 'critical',
          impact: 'alto',
          difficulty: 'facil',
          minutes: 5,
          fix: 'Remova o valor noindex da meta robots, ou confirme que a exclusão é intencional.',
          gain: 'Permite que a página apareça nos resultados de busca.',
          evidence: [d.robotsMeta],
        }),
      );
    }

    checks.push(check('viewport', 'Meta viewport', d.viewport ? 1 : 0, 2, d.viewport ?? 'ausente'));
    checks.push(check('charset', 'Charset declarado', d.charset ? 1 : 0, 1, d.charset ?? 'ausente'));
    checks.push(check('lang', 'Atributo lang no <html>', d.lang ? 1 : 0, 1, d.lang ?? 'ausente'));

    if (!d.lang) {
      issues.push(
        issue({
          id: 'seo-no-lang',
          title: 'Atributo lang ausente no <html>',
          description: 'Buscadores e leitores de tela usam o lang para determinar o idioma e a pronúncia correta do conteúdo.',
          severity: 'low',
          impact: 'baixo',
          difficulty: 'facil',
          minutes: 2,
          fix: 'Adicione lang="pt-BR" (ou o idioma correto) na tag <html>.',
          gain: 'Melhor segmentação por idioma e acessibilidade.',
        }),
      );
    }

    // ---- Estrutura de headings -------------------------------------------
    const h1s = d.headings.filter((h) => h.level === 1);
    checks.push(check('h1', 'H1 único', h1s.length === 1 ? 1 : h1s.length === 0 ? 0 : 0.4, 2, `${h1s.length} H1`));

    if (h1s.length === 0) {
      issues.push(
        issue({
          id: 'seo-no-h1',
          title: 'Página sem H1',
          description: 'O H1 define o tema principal da página para buscadores e leitores de tela.',
          severity: 'high',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 10,
          fix: 'Adicione um único <h1> descrevendo o assunto principal da página.',
          gain: 'Sinal claro de tema para buscadores e IA.',
        }),
      );
    } else if (h1s.length > 1) {
      issues.push(
        issue({
          id: 'seo-multiple-h1',
          title: `${h1s.length} tags H1 na mesma página`,
          description: 'Múltiplos H1 diluem o sinal de qual é o tema principal.',
          severity: 'low',
          impact: 'baixo',
          difficulty: 'facil',
          minutes: 15,
          fix: 'Mantenha um único H1 e converta os demais em H2.',
          gain: 'Hierarquia semântica mais clara.',
          evidence: h1s.map((h) => h.text),
        }),
      );
    }

    // Saltos de nível (h2 → h4)
    const skips: string[] = [];
    for (let i = 1; i < d.headings.length; i++) {
      const jump = d.headings[i].level - d.headings[i - 1].level;
      if (jump > 1) {
        skips.push(`H${d.headings[i - 1].level} → H${d.headings[i].level}: "${d.headings[i].text.slice(0, 60)}"`);
      }
    }
    checks.push(check('heading-order', 'Hierarquia de headings sem saltos', skips.length === 0 ? 1 : Math.max(0, 1 - skips.length / 6), 1, `${skips.length} salto(s)`));

    const emptyHeadings = d.headings.filter((h) => h.text.length === 0);
    checks.push(check('heading-empty', 'Headings com conteúdo', emptyHeadings.length === 0 ? 1 : 0.5, 0.5, `${emptyHeadings.length} vazio(s)`));

    if (skips.length > 0) {
      issues.push(
        issue({
          id: 'seo-heading-skip',
          title: `${skips.length} salto(s) na hierarquia de headings`,
          description: 'Pular níveis (por exemplo H2 direto para H4) quebra a estrutura lógica do documento para leitores de tela e para modelos de IA que extraem o outline.',
          severity: 'low',
          impact: 'baixo',
          difficulty: 'facil',
          minutes: 20,
          fix: 'Reordene os headings para descer um nível por vez. Use CSS para o tamanho visual, não a tag.',
          gain: 'Estrutura de documento mais compreensível para máquinas.',
          evidence: skips,
        }),
      );
    }

    // ---- Links ------------------------------------------------------------
    const internal = d.links.filter((l) => l.internal);
    const external = d.links.filter((l) => !l.internal);

    checks.push(check('internal-links', 'Links internos', internal.length >= 3 ? 1 : internal.length / 3, 1, String(internal.length)));
    checks.push(check('external-links', 'Links externos', external.length > 0 ? 1 : 0.8, 0.5, String(external.length)));

    const unsafeExternal = external.filter(
      (l) => l.target === '_blank' && !(l.rel ?? '').includes('noopener'),
    );
    checks.push(check('link-rel', 'Links externos com rel seguro', unsafeExternal.length === 0 ? 1 : 0.5, 0.5, `${unsafeExternal.length} sem noopener`));

    if (unsafeExternal.length > 0) {
      issues.push(
        issue({
          id: 'seo-unsafe-blank',
          title: `${unsafeExternal.length} link(s) target="_blank" sem rel="noopener"`,
          description: 'A página de destino ganha acesso parcial à janela de origem — risco de segurança e de performance.',
          severity: 'low',
          impact: 'baixo',
          difficulty: 'facil',
          minutes: 10,
          fix: 'Adicione rel="noopener noreferrer" a todos os links com target="_blank".',
          gain: 'Elimina o risco de tabnabbing.',
          evidence: unsafeExternal.slice(0, 5).map((l) => l.absolute),
        }),
      );
    }

    // Amostra de links verificados
    const sample = [...new Set(d.links.map((l) => l.absolute))]
      .filter((u) => u.startsWith('http'))
      .slice(0, MAX_LINK_CHECKS);

    const linkResults = await checkLinks(sample);
    const broken = linkResults.filter((r) => r.status === 0 || r.status >= 400);
    const redirected = linkResults.filter((r) => r.status >= 300 && r.status < 400);

    checks.push(check('broken-links', 'Links sem erro', sample.length === 0 ? 1 : 1 - broken.length / sample.length, 2, `${broken.length} quebrado(s) em ${sample.length} verificados`));
    checks.push(check('redirects', 'Links sem redirecionamento', sample.length === 0 ? 1 : 1 - redirected.length / sample.length, 0.5, `${redirected.length} redirecionado(s)`));

    if (broken.length > 0) {
      issues.push(
        issue({
          id: 'seo-broken-links',
          title: `${broken.length} link(s) quebrado(s)`,
          description: `De uma amostra de ${sample.length} links, ${broken.length} retornaram erro ou não responderam. Links quebrados prejudicam a experiência e desperdiçam autoridade de página.`,
          severity: broken.length > 3 ? 'high' : 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 10 * broken.length,
          fix: 'Corrija ou remova os links listados. Para páginas movidas, configure um redirecionamento 301 permanente.',
          gain: 'Melhor rastreamento pelos buscadores e menos becos sem saída para o usuário.',
          evidence: broken.map((b) => `HTTP ${b.status || 'sem resposta'} — ${b.url.slice(0, 110)}`),
        }),
      );
    }

    // ---- Redirecionamentos da própria página ------------------------------
    checks.push(check('page-redirects', 'Página sem cadeia de redirecionamentos', ctx.redirectChain.length === 0 ? 1 : Math.max(0, 1 - ctx.redirectChain.length / 3), 1, `${ctx.redirectChain.length} salto(s)`));

    if (ctx.redirectChain.length > 1) {
      issues.push(
        issue({
          id: 'seo-redirect-chain',
          title: `Cadeia de ${ctx.redirectChain.length} redirecionamentos`,
          description: 'Cada salto adiciona uma viagem completa de rede antes do conteúdo começar a carregar.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 20,
          fix: 'Aponte o primeiro redirecionamento diretamente para a URL final, eliminando os saltos intermediários.',
          gain: 'Economia de 100 ms a 500 ms por visita.',
          evidence: ctx.redirectChain.map((h) => `${h.status} → ${h.url}`),
        }),
      );
    }

    // ---- robots.txt -------------------------------------------------------
    const robots = ctx.robotsTxt;
    checks.push(check('robots-txt', 'robots.txt acessível', robots?.ok ? 1 : 0, 2, robots?.ok ? `HTTP ${robots.status}` : 'ausente'));

    if (!robots?.ok) {
      issues.push(
        issue({
          id: 'seo-no-robots',
          title: 'robots.txt ausente ou inacessível',
          description: 'Sem robots.txt os rastreadores não recebem orientação sobre o que rastrear nem onde está o sitemap.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 10,
          fix: 'Crie /robots.txt na raiz com as regras de rastreamento e uma linha `Sitemap: https://seudominio/sitemap.xml`.',
          gain: 'Rastreamento mais eficiente e descoberta automática do sitemap.',
        }),
      );
    } else {
      const blocksAll = /^\s*disallow\s*:\s*\/\s*$/im.test(robots.text) && /user-agent\s*:\s*\*/i.test(robots.text);
      checks.push(check('robots-not-blocking', 'robots.txt não bloqueia o site inteiro', blocksAll ? 0 : 1, 3, blocksAll ? 'bloqueia tudo' : 'ok'));

      if (blocksAll) {
        issues.push(
          issue({
            id: 'seo-robots-blocks-all',
            title: 'robots.txt bloqueia o site inteiro',
            description: 'A regra `Disallow: /` para User-agent: * impede que qualquer buscador rastreie o site.',
            severity: 'critical',
            impact: 'alto',
            difficulty: 'facil',
            minutes: 5,
            fix: 'Remova ou restrinja a regra Disallow: / a diretórios específicos que realmente não devem ser rastreados.',
            gain: 'Restaura a capacidade do site aparecer nas buscas.',
            evidence: [robots.text.slice(0, 400)],
          }),
        );
      }

      const hasSitemapLine = /sitemap\s*:/i.test(robots.text);
      checks.push(check('robots-sitemap', 'Sitemap declarado no robots.txt', hasSitemapLine ? 1 : 0.3, 1, hasSitemapLine ? 'sim' : 'não'));
    }

    // ---- Sitemap ----------------------------------------------------------
    const validSitemaps = ctx.sitemaps.filter((s) => s.ok);
    const totalUrls = validSitemaps.reduce((s, sm) => s + sm.urlCount, 0);
    const invalidUrls = validSitemaps.flatMap((s) => s.invalidUrls);

    checks.push(check('sitemap', 'sitemap.xml disponível', validSitemaps.length > 0 ? 1 : 0, 2, validSitemaps.length > 0 ? `${totalUrls} URLs` : 'ausente'));
    checks.push(check('sitemap-valid', 'URLs do sitemap válidas', invalidUrls.length === 0 ? 1 : 0.4, 1, `${invalidUrls.length} inválida(s)`));

    if (validSitemaps.length === 0) {
      issues.push(
        issue({
          id: 'seo-no-sitemap',
          title: 'Sitemap XML não encontrado',
          description: 'O sitemap acelera a descoberta de páginas novas e sinaliza a estrutura do site aos buscadores.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'media',
          minutes: 40,
          fix: 'Gere um sitemap.xml com todas as URLs canônicas, publique em /sitemap.xml e declare-o no robots.txt e no Search Console.',
          gain: 'Indexação mais rápida de conteúdo novo.',
        }),
      );
    } else if (invalidUrls.length > 0) {
      issues.push(
        issue({
          id: 'seo-sitemap-invalid',
          title: `${invalidUrls.length} URL(s) inválida(s) no sitemap`,
          description: 'URLs malformadas no sitemap são descartadas pelos rastreadores.',
          severity: 'low',
          impact: 'baixo',
          difficulty: 'facil',
          minutes: 20,
          fix: 'Use apenas URLs absolutas e corretamente codificadas no sitemap.',
          gain: 'Todas as páginas listadas passam a ser consideradas.',
          evidence: invalidUrls.slice(0, 6),
        }),
      );
    }

    // ---- Open Graph -------------------------------------------------------
    const ogRequired = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'];
    const ogPresent = ogRequired.filter((k) => d.openGraph[k]);
    checks.push(check('open-graph', 'Open Graph completo', ogPresent.length / ogRequired.length, 1.5, `${ogPresent.length}/${ogRequired.length}`));

    if (ogPresent.length < ogRequired.length) {
      const missing = ogRequired.filter((k) => !d.openGraph[k]);
      const ogTags = missing.map((m) => `<meta property="${m}" content="...">`).join(' ');
      issues.push(
        issue({
          id: 'seo-og-incomplete',
          title: `Open Graph incompleto (faltam ${missing.length} tags)`,
          description: 'Sem as tags Open Graph, o compartilhamento em redes sociais e apps de mensagem exibe um cartão genérico e sem imagem.',
          severity: missing.includes('og:image') ? 'medium' : 'low',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 15,
          // A lista sai para uma variável: o extrator de textos (i18n) lê o
          // molde da frase, e um template aninhado o deixaria ilegível.
          fix: `Adicione no <head>: ${ogTags}. A og:image deve ter ao menos 1200×630 px.`,
          gain: 'Cartões de compartilhamento atrativos e mais cliques vindos de redes sociais.',
          evidence: missing,
        }),
      );
    }

    // ---- Twitter Cards ----------------------------------------------------
    const twRequired = ['twitter:card', 'twitter:title', 'twitter:image'];
    const twPresent = twRequired.filter((k) => d.twitter[k]);
    checks.push(check('twitter', 'Twitter Cards', twPresent.length / twRequired.length, 1, `${twPresent.length}/${twRequired.length}`));

    if (twPresent.length === 0 && ogPresent.length < ogRequired.length) {
      recommendations.push('Adicione twitter:card="summary_large_image" junto com twitter:title e twitter:image.');
    }

    return {
      score: scoreFromChecks(checks),
      checks,
      issues,
      recommendations,
      evidence: {
        title: d.title,
        metaDescription: d.metaDescription,
        canonical: d.canonical,
        headings: d.headings.slice(0, 30),
        linkStats: { internal: internal.length, external: external.length, checked: sample.length, broken: broken.length },
        openGraph: d.openGraph,
        twitter: d.twitter,
        sitemaps: ctx.sitemaps,
      },
    };
  },
};

export default plugin;
