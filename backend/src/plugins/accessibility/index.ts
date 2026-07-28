import { scoreFromChecks } from '../../core/scoring.js';
import type { AuditContext, AuditPlugin, Check, PluginIssue } from '../../core/types.js';
import { check, issue } from '../helpers.js';

const plugin: AuditPlugin = {
  id: 'accessibility',
  name: 'Acessibilidade',
  description: 'Contraste, textos alternativos, rótulos de formulário, navegação por teclado e marcos semânticos.',
  category: 'accessibility',
  weight: 2,
  checks: [
    'Contraste de cores', 'Alt em imagens', 'Rótulos de formulário', 'aria-label',
    'tabindex', 'Ordem de foco', 'Navegação por teclado', 'Leitores de tela',
    'Marcos (landmarks)', 'Idioma declarado', 'Hierarquia de headings',
  ],

  async run(ctx: AuditContext) {
    const checks: Check[] = [];
    const issues: PluginIssue[] = [];
    const recommendations: string[] = [];
    const d = ctx.dom;

    // ---- Textos alternativos ---------------------------------------------
    const totalImages = d.images.length;
    const withAlt = totalImages - d.imagesWithoutAlt;
    checks.push(check('alt', 'Imagens com atributo alt', totalImages === 0 ? 1 : withAlt / totalImages, 3, `${withAlt}/${totalImages}`));

    if (d.imagesWithoutAlt > 0) {
      issues.push(
        issue({
          id: 'a11y-missing-alt',
          title: `${d.imagesWithoutAlt} imagem(ns) sem atributo alt`,
          description:
            'Leitores de tela anunciam o nome do arquivo quando não há alt, tornando a informação inacessível. É também o texto exibido quando a imagem falha ao carregar.',
          severity: 'high',
          impact: 'alto',
          difficulty: 'facil',
          minutes: 5 * Math.min(d.imagesWithoutAlt, 12),
          fix:
            'Adicione alt descritivo a cada imagem informativa. Para imagens puramente decorativas, use alt="" (vazio, mas presente) para que sejam ignoradas pelo leitor de tela.',
          gain: 'Conformidade com WCAG 1.1.1 e conteúdo acessível a usuários de leitores de tela.',
          evidence: d.images.filter((i) => i.alt === null).slice(0, 8).map((i) => i.src.slice(0, 110)),
        }),
      );
    }

    // Alt genérico
    const genericAlt = d.images.filter(
      (i) => i.alt && /^(imagem|image|foto|photo|picture|img|banner|logo)\.?$/i.test(i.alt.trim()),
    );
    checks.push(check('alt-quality', 'Alt descritivo (não genérico)', totalImages === 0 ? 1 : 1 - genericAlt.length / Math.max(1, totalImages), 1, `${genericAlt.length} genérico(s)`));

    // ---- Rótulos de formulário -------------------------------------------
    const unlabeled = d.inputsWithoutLabel.length;
    const totalFormFields = d.forms.reduce((s, f) => s + f.fields, 0);
    checks.push(check('labels', 'Campos de formulário rotulados', totalFormFields === 0 ? 1 : Math.max(0, 1 - unlabeled / Math.max(1, totalFormFields)), 2.5, `${unlabeled} sem rótulo`));

    if (unlabeled > 0) {
      issues.push(
        issue({
          id: 'a11y-unlabeled-inputs',
          title: `${unlabeled} campo(s) de formulário sem rótulo`,
          description:
            'Sem <label> associado (ou aria-label), o usuário de leitor de tela não sabe o que preencher. É uma das falhas de acessibilidade mais bloqueantes.',
          severity: 'high',
          impact: 'alto',
          difficulty: 'facil',
          minutes: 10 * Math.min(unlabeled, 10),
          fix: 'Associe cada campo a um <label for="id-do-campo">. Quando o rótulo visual não for desejável, use aria-label no campo.',
          gain: 'Formulários utilizáveis por leitores de tela e conformidade com WCAG 3.3.2.',
          evidence: d.inputsWithoutLabel.slice(0, 8).map((i) => `${i.selector} (tipo: ${i.type})`),
        }),
      );
    }

    // ---- Contraste --------------------------------------------------------
    const contrastCount = d.contrastIssues.length;
    checks.push(check('contrast', 'Contraste de texto conforme WCAG AA', contrastCount === 0 ? 1 : Math.max(0, 1 - contrastCount / 12), 3, `${contrastCount} elemento(s) abaixo do mínimo`));

    if (contrastCount > 0) {
      const worst = [...d.contrastIssues].sort((a, b) => a.ratio - b.ratio)[0];
      issues.push(
        issue({
          id: 'a11y-contrast',
          title: `${contrastCount} elemento(s) com contraste insuficiente`,
          description: `O pior caso tem razão de ${worst.ratio}:1, abaixo do mínimo de 4,5:1 exigido pela WCAG AA para texto normal. Afeta leitura em telas com brilho, sob sol e por pessoas com baixa visão.`,
          severity: worst.ratio < 3 ? 'high' : 'medium',
          impact: 'alto',
          difficulty: 'facil',
          minutes: 30,
          fix:
            'Escureça a cor do texto ou clareie o fundo até atingir 4,5:1 (3:1 para texto grande ou em negrito acima de 18,66px). Verifique em um conferidor de contraste.',
          gain: 'Leitura confortável para todos os usuários e conformidade com WCAG 1.4.3.',
          evidence: d.contrastIssues.slice(0, 8).map((c) => `${c.ratio}:1 — ${c.selector} — "${c.text}"`),
        }),
      );
    }

    // ---- ARIA e navegação -------------------------------------------------
    checks.push(check('aria', 'Uso de atributos ARIA', d.ariaLabels > 0 ? 1 : 0.4, 1, `${d.ariaLabels} elemento(s)`));
    checks.push(check('tabindex', 'Sem tabindex positivo', d.positiveTabIndex.length === 0 ? 1 : 0.2, 1.5, `${d.positiveTabIndex.length} positivo(s)`));

    if (d.positiveTabIndex.length > 0) {
      issues.push(
        issue({
          id: 'a11y-positive-tabindex',
          title: `${d.positiveTabIndex.length} elemento(s) com tabindex positivo`,
          description:
            'tabindex maior que zero força uma ordem de tabulação artificial que quase sempre diverge da ordem visual, confundindo quem navega por teclado.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 20,
          fix: 'Use tabindex="0" para tornar elementos focáveis na ordem natural, ou "-1" para removê-los da tabulação. Ajuste a ordem no DOM, não no tabindex.',
          gain: 'Navegação por teclado previsível.',
          evidence: d.positiveTabIndex.map((t) => `${t.selector} → tabindex=${t.tabIndex}`),
        }),
      );
    }

    // ---- Marcos (landmarks) -----------------------------------------------
    const lm = d.landmarks;
    const landmarkScore =
      (lm.main > 0 ? 0.4 : 0) + (lm.navigation > 0 ? 0.25 : 0) + (lm.banner > 0 ? 0.2 : 0) + (lm.contentinfo > 0 ? 0.15 : 0);
    checks.push(check('landmarks', 'Marcos de navegação (header/nav/main/footer)', landmarkScore, 2, `main:${lm.main} nav:${lm.navigation} header:${lm.banner} footer:${lm.contentinfo}`));

    if (lm.main === 0) {
      issues.push(
        issue({
          id: 'a11y-no-main-landmark',
          title: 'Sem marco <main>',
          description: 'Usuários de leitor de tela usam o marco principal para pular a navegação e ir direto ao conteúdo. Sem ele, precisam tabular por todo o menu em cada página.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 15,
          fix: 'Envolva o conteúdo principal em <main> e adicione um link "pular para o conteúdo" no topo apontando para ele.',
          gain: 'Navegação muito mais rápida para usuários de tecnologia assistiva.',
        }),
      );
    }

    // ---- Idioma -----------------------------------------------------------
    checks.push(check('lang', 'Idioma declarado', d.lang ? 1 : 0, 1.5, d.lang ?? 'ausente'));

    if (!d.lang) {
      issues.push(
        issue({
          id: 'a11y-no-lang',
          title: 'Idioma da página não declarado',
          description: 'Sem lang, o leitor de tela usa a voz padrão do sistema, podendo pronunciar português com fonética inglesa.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 2,
          fix: 'Adicione lang="pt-BR" na tag <html>.',
          gain: 'Pronúncia correta em leitores de tela (WCAG 3.1.1).',
        }),
      );
    }

    // ---- Foco visível e navegação por teclado -----------------------------
    checks.push(check('focusable', 'Elementos focáveis presentes', d.focusableCount > 0 ? 1 : 0, 1, `${d.focusableCount} elemento(s)`));

    const emptyLinks = d.links.filter((l) => l.text.trim().length === 0);
    checks.push(check('link-text', 'Links com texto descritivo', d.links.length === 0 ? 1 : 1 - emptyLinks.length / d.links.length, 1.5, `${emptyLinks.length} sem texto`));

    if (emptyLinks.length > 0) {
      issues.push(
        issue({
          id: 'a11y-empty-links',
          title: `${emptyLinks.length} link(s) sem texto acessível`,
          description: 'Links contendo apenas ícones ou imagens sem alt são anunciados como "link" pelo leitor de tela, sem indicação do destino.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 20,
          fix: 'Adicione aria-label ao link, ou um alt descritivo à imagem interna, ou texto visualmente oculto com uma classe sr-only.',
          gain: 'Todos os links passam a ser compreensíveis fora do contexto visual.',
          evidence: emptyLinks.slice(0, 6).map((l) => l.absolute.slice(0, 110)),
        }),
      );
    }

    const genericLinkText = d.links.filter((l) => /^(clique aqui|aqui|saiba mais|leia mais|link|veja)$/i.test(l.text.trim()));
    checks.push(check('link-text-quality', 'Textos de link específicos', d.links.length === 0 ? 1 : 1 - genericLinkText.length / Math.max(1, d.links.length), 0.5, `${genericLinkText.length} genérico(s)`));

    if (genericLinkText.length > 3) {
      recommendations.push(
        `Substitua textos genéricos ("clique aqui", "saiba mais") por descrições do destino — leitores de tela listam links fora de contexto.`,
      );
    }

    return {
      score: scoreFromChecks(checks),
      checks,
      issues,
      recommendations,
      evidence: {
        imagesWithoutAlt: d.imagesWithoutAlt,
        totalImages,
        unlabeledInputs: d.inputsWithoutLabel,
        contrastIssues: d.contrastIssues,
        landmarks: d.landmarks,
        positiveTabIndex: d.positiveTabIndex,
        lang: d.lang,
      },
    };
  },
};

export default plugin;
