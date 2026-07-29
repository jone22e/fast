import { scoreFromChecks } from '../../core/scoring.js';
import type { AuditContext, AuditPlugin, Check, FetchedText, PluginIssue } from '../../core/types.js';
import { check, formatBytes, issue } from '../helpers.js';

/** Rastreadores de IA relevantes e o que cada um alimenta. */
const AI_CRAWLERS: { name: string; purpose: string; critical: boolean }[] = [
  { name: 'GPTBot', purpose: 'treinamento do ChatGPT (OpenAI)', critical: true },
  { name: 'OAI-SearchBot', purpose: 'busca do ChatGPT (OpenAI)', critical: true },
  { name: 'ChatGPT-User', purpose: 'navegação sob demanda do ChatGPT', critical: true },
  { name: 'ClaudeBot', purpose: 'treinamento e busca do Claude (Anthropic)', critical: true },
  { name: 'Claude-Web', purpose: 'navegação do Claude', critical: false },
  { name: 'anthropic-ai', purpose: 'coleta legada da Anthropic', critical: false },
  { name: 'Google-Extended', purpose: 'Gemini e AI Overviews do Google', critical: true },
  { name: 'PerplexityBot', purpose: 'respostas e citações do Perplexity', critical: true },
  { name: 'Applebot-Extended', purpose: 'Apple Intelligence', critical: false },
  { name: 'Bingbot', purpose: 'Bing e Copilot da Microsoft', critical: true },
  { name: 'CCBot', purpose: 'Common Crawl (base de muitos modelos)', critical: false },
  { name: 'Amazonbot', purpose: 'Alexa e serviços da Amazon', critical: false },
  { name: 'Bytespider', purpose: 'ByteDance / Doubao', critical: false },
  { name: 'meta-externalagent', purpose: 'Meta AI', critical: false },
  { name: 'cohere-ai', purpose: 'modelos da Cohere', critical: false },
];

/** Tipos de Schema.org que a especificação pede para validar. */
const SCHEMA_TYPES = [
  'Organization', 'Product', 'LocalBusiness', 'FAQPage', 'Article', 'Review',
  'Person', 'BreadcrumbList', 'VideoObject', 'Event', 'Service', 'SoftwareApplication',
];

/**
 * Interpreta o robots.txt e decide se um user-agent está bloqueado na raiz.
 * Segue a precedência do padrão: grupo específico vence sobre o coringa.
 */
function isBlocked(robotsTxt: string, agent: string): { blocked: boolean; explicit: boolean; rule?: string } {
  const lines = robotsTxt.split('\n').map((l) => l.replace(/#.*$/, '').trim());
  const groups: { agents: string[]; disallow: string[]; allow: string[] }[] = [];
  let current: (typeof groups)[number] | null = null;
  let lastWasAgent = false;

  for (const line of lines) {
    const [rawKey, ...rest] = line.split(':');
    if (rest.length === 0) continue;
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(':').trim();

    if (key === 'user-agent') {
      if (!current || !lastWasAgent) {
        current = { agents: [], disallow: [], allow: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if (key === 'disallow' && current) {
      current.disallow.push(value);
      lastWasAgent = false;
    } else if (key === 'allow' && current) {
      current.allow.push(value);
      lastWasAgent = false;
    } else {
      lastWasAgent = false;
    }
  }

  const lower = agent.toLowerCase();
  const specific = groups.find((g) => g.agents.includes(lower));
  const wildcard = groups.find((g) => g.agents.includes('*'));
  const group = specific ?? wildcard;

  if (!group) return { blocked: false, explicit: false };

  const blocksRoot = group.disallow.some((d) => d === '/');
  const allowsRoot = group.allow.some((a) => a === '/');

  return {
    blocked: blocksRoot && !allowsRoot,
    explicit: Boolean(specific),
    rule: blocksRoot ? `User-agent: ${specific ? agent : '*'} / Disallow: /` : undefined,
  };
}

/** Valida estrutura de um llms.txt conforme a convenção llmstxt.org. */
function analyzeLlmsTxt(file: FetchedText): {
  hasH1: boolean;
  hasSummary: boolean;
  sections: number;
  links: number;
  isHtml: boolean;
  utf8: boolean;
} {
  const text = file.text;
  const isHtml = /<!doctype html|<html[\s>]/i.test(text.slice(0, 500));
  return {
    hasH1: /^#\s+\S/m.test(text),
    hasSummary: /^>\s+\S/m.test(text) || /^#\s+.+\n+[^\n#]{40,}/m.test(text),
    sections: (text.match(/^##\s+/gm) ?? []).length,
    links: (text.match(/\[[^\]]+\]\([^)]+\)/g) ?? []).length,
    isHtml,
    utf8: !file.encoding || file.encoding.includes('utf-8') || file.encoding.includes('utf8'),
  };
}

const plugin: AuditPlugin = {
  id: 'geo',
  name: 'GEO — Generative Engine Optimization',
  description:
    'Otimização para mecanismos de IA: llms.txt, permissões de rastreadores, estrutura semântica, autoridade e dados estruturados.',
  category: 'geo',
  weight: 3,
  checks: [
    'llms.txt existe', 'llms.txt HTTP 200', 'llms.txt encoding', 'llms.txt tamanho',
    'llms.txt estrutura', 'llms.txt links internos', 'llms-full.txt',
    'GPTBot', 'ClaudeBot', 'Google-Extended', 'PerplexityBot', 'CCBot', 'Bingbot', 'outros rastreadores',
    'Definições claras', 'FAQs', 'Listas', 'Tabelas', 'Passo a passo', 'Resumos',
    'Autor', 'Data de publicação', 'Data de atualização', 'Referências',
    'article/main/nav/section/aside/figure/header/footer/time',
    'Schema.org Organization/Product/FAQ/Article/Breadcrumb/…',
  ],

  async run(ctx: AuditContext) {
    const checks: Check[] = [];
    const issues: PluginIssue[] = [];
    const recommendations: string[] = [];
    const d = ctx.dom;

    // =====================================================================
    // 1. llms.txt
    // =====================================================================
    const llms = ctx.llmsTxt;
    const llmsOk = Boolean(llms?.ok && llms.status === 200);
    checks.push(check('llms-exists', 'llms.txt disponível', llmsOk ? 1 : 0, 3, llms ? `HTTP ${llms.status}` : 'não encontrado'));

    if (!llmsOk) {
      issues.push(
        issue({
          id: 'geo-no-llms-txt',
          title: 'Arquivo llms.txt ausente',
          description:
            'O llms.txt é a convenção emergente para orientar modelos de linguagem sobre o conteúdo do site: o que ele é, quais páginas importam e como interpretá-las. Sem ele, ChatGPT, Claude, Perplexity e Gemini precisam adivinhar a estrutura a partir do HTML.',
          severity: 'high',
          impact: 'alto',
          difficulty: 'facil',
          minutes: 45,
          fix:
            'Crie /llms.txt em Markdown: um "# Nome do site" no topo, um parágrafo de resumo iniciado por "> ", e seções "## " agrupando links para as páginas mais importantes com uma frase de descrição cada.',
          gain: 'Maior chance de ser citado corretamente por mecanismos de IA e menos alucinações sobre o seu produto.',
          evidence: [`Testado: ${ctx.origin}/llms.txt`],
        }),
      );
    } else if (llms) {
      const analysis = analyzeLlmsTxt(llms);

      checks.push(check('llms-encoding', 'llms.txt em UTF-8', analysis.utf8 ? 1 : 0, 1, llms.encoding ?? 'não declarado'));
      checks.push(check('llms-size', 'llms.txt com tamanho razoável', llms.sizeBytes > 100 && llms.sizeBytes < 200_000 ? 1 : 0.4, 1, formatBytes(llms.sizeBytes)));
      checks.push(check('llms-format', 'llms.txt em Markdown (não HTML)', analysis.isHtml ? 0 : 1, 2, analysis.isHtml ? 'HTML detectado' : 'Markdown'));
      checks.push(check('llms-h1', 'llms.txt com título H1', analysis.hasH1 ? 1 : 0, 1.5));
      checks.push(check('llms-summary', 'llms.txt com resumo', analysis.hasSummary ? 1 : 0, 1));
      checks.push(check('llms-sections', 'llms.txt com seções', analysis.sections > 0 ? 1 : 0.3, 1, `${analysis.sections} seção(ões)`));
      checks.push(check('llms-links', 'llms.txt com links internos', analysis.links >= 3 ? 1 : analysis.links / 3, 1.5, `${analysis.links} link(s)`));

      if (analysis.isHtml) {
        issues.push(
          issue({
            id: 'geo-llms-html',
            title: 'llms.txt está retornando HTML',
            description: 'O servidor devolve a página de erro ou o app SPA em vez do arquivo de texto. Modelos que buscarem o arquivo receberão markup inútil.',
            severity: 'high',
            impact: 'alto',
            difficulty: 'facil',
            minutes: 20,
            fix: 'Sirva /llms.txt como arquivo estático com Content-Type: text/plain; charset=utf-8, antes de qualquer rota catch-all da aplicação.',
            gain: 'O arquivo passa a ser efetivamente consumível por modelos de IA.',
          }),
        );
      } else if (analysis.links < 3 || !analysis.hasH1) {
        issues.push(
          issue({
            id: 'geo-llms-weak',
            title: 'llms.txt com estrutura incompleta',
            // Cada variante é uma frase inteira, e não pedaços concatenados:
            // assim o texto tem tradução própria no catálogo de i18n.
            description: !analysis.hasH1
              ? analysis.links < 3
                ? `O arquivo existe mas não tem título H1 e tem apenas ${analysis.links} link(s). Modelos extraem pouco valor dele.`
                : 'O arquivo existe mas não tem título H1. Modelos extraem pouco valor dele.'
              : `O arquivo existe mas tem apenas ${analysis.links} link(s). Modelos extraem pouco valor dele.`,
            severity: 'medium',
            impact: 'medio',
            difficulty: 'facil',
            minutes: 30,
            fix: 'Estruture como: "# Nome", "> resumo em uma frase", depois "## Docs", "## Produtos" etc. com links no formato "- [Título](url): descrição".',
            gain: 'Respostas de IA mais precisas sobre o que o site oferece.',
            evidence: [llms.text.slice(0, 300)],
          }),
        );
      }
    }

    // llms-full.txt
    const llmsFull = ctx.llmsFullTxt;
    const llmsFullOk = Boolean(llmsFull?.ok && llmsFull.status === 200 && llmsFull.sizeBytes > 500);
    checks.push(check('llms-full', 'llms-full.txt disponível', llmsFullOk ? 1 : 0.5, 1, llmsFull ? `HTTP ${llmsFull.status} · ${formatBytes(llmsFull.sizeBytes)}` : 'não encontrado'));

    if (!llmsFullOk && llmsOk) {
      recommendations.push(
        'Publique também /llms-full.txt com o conteúdo completo em Markdown — modelos que suportam a convenção conseguem ler todo o material sem rastrear página a página.',
      );
    }

    // =====================================================================
    // 2. Permissões de rastreadores de IA
    // =====================================================================
    const robotsText = ctx.robotsTxt?.ok ? ctx.robotsTxt.text : '';
    const crawlerStatus = AI_CRAWLERS.map((c) => ({ ...c, ...isBlocked(robotsText, c.name) }));
    const blockedCritical = crawlerStatus.filter((c) => c.blocked && c.critical);
    const blockedAny = crawlerStatus.filter((c) => c.blocked);

    checks.push(
      check(
        'ai-crawlers',
        'Rastreadores de IA com acesso permitido',
        crawlerStatus.length === 0 ? 1 : 1 - blockedAny.length / crawlerStatus.length,
        3,
        `${crawlerStatus.length - blockedAny.length}/${crawlerStatus.length} liberados`,
      ),
    );

    if (blockedCritical.length > 0) {
      issues.push(
        issue({
          id: 'geo-blocked-ai-crawlers',
          title: `${blockedCritical.length} rastreador(es) de IA importante(s) bloqueado(s)`,
          description: `O robots.txt impede o acesso de: ${blockedCritical.map((c) => c.name).join(', ')}. Se o bloqueio não for intencional, o site fica invisível para os mecanismos generativos que hoje respondem boa parte das buscas informacionais.`,
          severity: 'high',
          impact: 'alto',
          difficulty: 'facil',
          minutes: 15,
          fix:
            'Revise o robots.txt. Para liberar, adicione um grupo por rastreador: "User-agent: GPTBot" seguido de "Allow: /". Atenção: um "Disallow: /" em "User-agent: *" bloqueia todos os que não têm regra própria.',
          gain: 'Presença nas respostas de ChatGPT, Claude, Perplexity, Copilot e AI Overviews do Google.',
          evidence: blockedCritical.map((c) => `${c.name} (${c.purpose}) — ${c.rule ?? 'bloqueado'}`),
        }),
      );
    } else if (blockedAny.length > 0) {
      issues.push(
        issue({
          id: 'geo-blocked-secondary-crawlers',
          title: `${blockedAny.length} rastreador(es) de IA secundário(s) bloqueado(s)`,
          description: `Bloqueados: ${blockedAny.map((c) => c.name).join(', ')}. Impacto menor, mas reduz o alcance em modelos treinados sobre essas bases.`,
          severity: 'low',
          impact: 'baixo',
          difficulty: 'facil',
          minutes: 10,
          fix: 'Se o bloqueio não for intencional (por exemplo por política de uso de conteúdo), libere esses agentes no robots.txt.',
          gain: 'Cobertura mais ampla entre modelos de linguagem.',
          evidence: blockedAny.map((c) => `${c.name} — ${c.purpose}`),
        }),
      );
    }

    // =====================================================================
    // 3. Conteúdo amigável para IA
    // =====================================================================
    const text = d.text;
    const hasDefinitions = /\b(é um|é uma|significa|define-se|refere-se a|consiste em|trata-se de)\b/i.test(text);
    const hasSteps = /\b(passo\s*\d|etapa\s*\d|primeiro,|em seguida,|por fim,|\d\.\s)/i.test(text) || d.headings.some((h) => /passo|etapa|como /i.test(h.text));
    const hasExamples = /\b(por exemplo|exemplo:|como no caso|ex\.:)\b/i.test(text);
    const hasSummary = /\b(em resumo|resumindo|conclusão|principais pontos|tl;dr)\b/i.test(text) || d.headings.some((h) => /resumo|conclus/i.test(h.text));
    const hasFaq = d.faqBlocks > 0 || d.headings.some((h) => /perguntas frequentes|faq|d[úu]vidas/i.test(h.text));

    checks.push(check('ai-definitions', 'Definições claras no texto', hasDefinitions ? 1 : 0.3, 1));
    checks.push(check('ai-faq', 'Seção de perguntas frequentes', hasFaq ? 1 : 0.3, 1.5, hasFaq ? 'presente' : 'ausente'));
    checks.push(check('ai-lists', 'Uso de listas', d.lists >= 2 ? 1 : d.lists / 2, 1, `${d.lists} lista(s)`));
    checks.push(check('ai-tables', 'Uso de tabelas', d.tables > 0 ? 1 : 0.5, 0.5, `${d.tables} tabela(s)`));
    checks.push(check('ai-steps', 'Conteúdo em passo a passo', hasSteps ? 1 : 0.5, 1));
    checks.push(check('ai-examples', 'Exemplos concretos', hasExamples ? 1 : 0.5, 1));
    checks.push(check('ai-summary', 'Resumo ou conclusão', hasSummary ? 1 : 0.4, 1));

    if (!hasFaq) {
      issues.push(
        issue({
          id: 'geo-no-faq',
          title: 'Sem seção de perguntas frequentes',
          description:
            'Blocos de pergunta e resposta são o formato que modelos de IA mais facilmente extraem e citam, porque já vêm no formato da resposta que o usuário procura.',
          severity: 'medium',
          impact: 'alto',
          difficulty: 'media',
          minutes: 90,
          fix: 'Crie uma seção "Perguntas frequentes" com 5 a 10 pares pergunta/resposta objetivos, e marque com Schema.org FAQPage.',
          gain: 'Aumento significativo na probabilidade de citação direta por ChatGPT, Perplexity e AI Overviews.',
        }),
      );
    }

    if (!hasDefinitions && d.wordCount > 300) {
      recommendations.push(
        'Inclua definições explícitas logo no início ("X é um ..."), formato que modelos extraem com alta confiança.',
      );
    }

    // =====================================================================
    // 4. Autoridade
    // =====================================================================
    checks.push(check('authority-author', 'Autoria identificada', d.author ? 1 : 0, 1.5, d.author ?? 'ausente'));
    checks.push(check('authority-published', 'Data de publicação', d.publishedTime ? 1 : 0, 1.5, d.publishedTime ?? 'ausente'));
    checks.push(check('authority-modified', 'Data de atualização', d.modifiedTime ? 1 : 0.4, 1, d.modifiedTime ?? 'ausente'));

    const externalRefs = d.links.filter((l) => !l.internal && !/facebook|twitter|instagram|linkedin|youtube|x\.com/i.test(l.absolute));
    checks.push(check('authority-refs', 'Referências externas', externalRefs.length >= 2 ? 1 : externalRefs.length / 2, 1, `${externalRefs.length} referência(s)`));

    const missingAuthority = [!d.author && 'autor', !d.publishedTime && 'data de publicação', !d.modifiedTime && 'data de atualização'].filter(Boolean);

    if (missingAuthority.length >= 2) {
      issues.push(
        issue({
          id: 'geo-no-authority',
          title: `Sinais de autoridade ausentes: ${missingAuthority.join(', ')}`,
          description:
            'Modelos de IA priorizam fontes que declaram quem escreveu e quando. Conteúdo sem autoria nem data é tratado como menos confiável e menos citável.',
          severity: 'medium',
          impact: 'alto',
          difficulty: 'facil',
          minutes: 40,
          fix:
            'Adicione <meta name="author">, <meta property="article:published_time"> e article:modified_time, além de um bloco visível de autoria. Complemente com Schema.org Article contendo author, datePublished e dateModified.',
          gain: 'Maior peso de confiabilidade (E-E-A-T) e mais citações em respostas geradas.',
          evidence: missingAuthority as string[],
        }),
      );
    }

    // =====================================================================
    // 5. Estrutura semântica
    // =====================================================================
    const semanticRequired = ['article', 'main', 'nav', 'section', 'aside', 'figure', 'figcaption', 'header', 'footer', 'time'];
    const semanticPresent = semanticRequired.filter((tag) => (d.semanticTags[tag] ?? 0) > 0);
    checks.push(
      check(
        'semantic-tags',
        'Tags semânticas HTML5',
        semanticPresent.length / semanticRequired.length,
        2,
        `${semanticPresent.length}/${semanticRequired.length}`,
      ),
    );

    if ((d.semanticTags.main ?? 0) === 0) {
      issues.push(
        issue({
          id: 'geo-no-main',
          title: 'Sem elemento <main>',
          description:
            'O <main> delimita o conteúdo principal e separa-o de menus, rodapés e barras laterais. Sem ele, extratores de conteúdo (incluindo os de IA) frequentemente capturam navegação junto com o texto.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 20,
          fix: 'Envolva o conteúdo principal em <main> (um por página) e mova menus para <nav> e rodapé para <footer>.',
          gain: 'Extração de conteúdo mais limpa por IA e leitores de tela.',
        }),
      );
    }

    if (semanticPresent.length < 5) {
      issues.push(
        issue({
          id: 'geo-weak-semantics',
          title: `Apenas ${semanticPresent.length} de ${semanticRequired.length} tags semânticas em uso`,
          description: 'A página depende majoritariamente de <div>, o que não transmite significado estrutural a máquinas.',
          severity: 'low',
          impact: 'medio',
          difficulty: 'media',
          minutes: 60,
          fix: 'Substitua divs estruturais por header, nav, main, article, section, aside, figure/figcaption, footer e time.',
          gain: 'Melhor compreensão da estrutura por buscadores e modelos generativos.',
          evidence: [`Ausentes: ${semanticRequired.filter((t) => !semanticPresent.includes(t)).join(', ')}`],
        }),
      );
    }

    // =====================================================================
    // 6. Schema.org
    // =====================================================================
    const declaredTypes = new Set<string>();

    const walk = (node: unknown): void => {
      if (Array.isArray(node)) {
        node.forEach(walk);
        return;
      }
      if (node && typeof node === 'object') {
        const obj = node as Record<string, unknown>;
        const type = obj['@type'];
        if (typeof type === 'string') declaredTypes.add(type);
        if (Array.isArray(type)) type.forEach((t) => typeof t === 'string' && declaredTypes.add(t));
        Object.values(obj).forEach(walk);
      }
    };
    d.jsonLd.forEach(walk);

    for (const itemtype of d.microdataTypes) {
      const name = itemtype.split('/').pop();
      if (name) declaredTypes.add(name);
    }

    const recognized = SCHEMA_TYPES.filter((t) => declaredTypes.has(t) || (t === 'FAQPage' && declaredTypes.has('FAQ')));
    const parseErrors = d.jsonLd.filter(
      (j) => j && typeof j === 'object' && (j as Record<string, unknown>).__parseError,
    ).length;

    checks.push(check('schema-present', 'Dados estruturados presentes', declaredTypes.size > 0 ? 1 : 0, 2.5, `${declaredTypes.size} tipo(s)`));
    checks.push(check('schema-valid', 'JSON-LD sem erro de sintaxe', parseErrors === 0 ? 1 : 0, 1.5, parseErrors > 0 ? `${parseErrors} bloco(s) inválido(s)` : 'ok'));
    checks.push(check('schema-coverage', 'Cobertura de tipos relevantes', Math.min(1, recognized.length / 3), 1.5, recognized.join(', ') || 'nenhum'));

    if (declaredTypes.size === 0) {
      issues.push(
        issue({
          id: 'geo-no-schema',
          title: 'Sem dados estruturados (Schema.org)',
          description:
            'Dados estruturados em JSON-LD são a forma mais direta de declarar fatos sobre a página de maneira não ambígua — quem é a organização, qual o produto, qual o preço, quem escreveu. Modelos de IA e buscadores usam isso como fonte de alta confiança.',
          severity: 'high',
          impact: 'alto',
          difficulty: 'media',
          minutes: 90,
          fix:
            'Adicione um bloco <script type="application/ld+json"> com pelo menos Organization (ou LocalBusiness) e o tipo específico da página (Article, Product, Service, FAQPage). Valide no Rich Results Test do Google.',
          gain: 'Elegibilidade a resultados enriquecidos e maior precisão nas respostas de IA sobre a marca.',
        }),
      );
    } else if (parseErrors > 0) {
      issues.push(
        issue({
          id: 'geo-schema-invalid',
          title: `${parseErrors} bloco(s) JSON-LD com erro de sintaxe`,
          description: 'JSON malformado é descartado silenciosamente — o esforço de marcação não produz efeito algum.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 20,
          fix: 'Valide cada bloco JSON-LD em um validador de JSON e no Rich Results Test do Google.',
          gain: 'Os dados estruturados passam a ser efetivamente lidos.',
        }),
      );
    } else if (recognized.length < 2) {
      recommendations.push(
        `Você declara ${[...declaredTypes].join(', ')}. Considere adicionar ${SCHEMA_TYPES.filter((t) => !declaredTypes.has(t)).slice(0, 4).join(', ')} conforme o tipo de conteúdo da página.`,
      );
    }

    if (!declaredTypes.has('BreadcrumbList') && d.links.filter((l) => l.internal).length > 10) {
      recommendations.push('Adicione BreadcrumbList em JSON-LD para expor a hierarquia de navegação a buscadores e IA.');
    }

    // =====================================================================
    // 7. IA Score — nota específica de consumo por LLMs
    // =====================================================================
    const aiScoreChecks = checks.filter((c) =>
      ['llms-', 'ai-', 'semantic-', 'schema-', 'authority-'].some((prefix) => c.id.startsWith(prefix)),
    );
    const aiScore = scoreFromChecks(aiScoreChecks);

    return {
      score: scoreFromChecks(checks),
      checks,
      issues,
      recommendations,
      evidence: {
        aiScore,
        llmsTxt: llms ? { status: llms.status, size: llms.sizeBytes, preview: llms.text.slice(0, 500) } : null,
        llmsFullTxt: llmsFull ? { status: llmsFull.status, size: llmsFull.sizeBytes } : null,
        crawlers: crawlerStatus.map((c) => ({ name: c.name, purpose: c.purpose, blocked: c.blocked, explicit: c.explicit })),
        schemaTypes: [...declaredTypes],
        semanticTags: d.semanticTags,
        authority: { author: d.author, published: d.publishedTime, modified: d.modifiedTime },
      },
    };
  },
};

export default plugin;
