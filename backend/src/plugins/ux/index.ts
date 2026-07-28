import { scale, scoreFromChecks } from '../../core/scoring.js';
import type { AuditContext, AuditPlugin, Check, PluginIssue } from '../../core/types.js';
import { check, formatMs, issue } from '../helpers.js';

const plugin: AuditPlugin = {
  id: 'ux',
  name: 'UX',
  description: 'Consistência visual, navegação, hierarquia, CTAs, formulários e tempo até a interatividade.',
  category: 'ux',
  weight: 1.5,
  checks: [
    'Consistência tipográfica', 'Paleta de cores', 'Navegação principal',
    'Hierarquia visual', 'CTAs identificáveis', 'Menus', 'Formulários',
    'Tempo até interação', 'Elementos clicáveis', 'Rodapé informativo',
  ],

  async run(ctx: AuditContext) {
    const checks: Check[] = [];
    const issues: PluginIssue[] = [];
    const recommendations: string[] = [];
    const d = ctx.dom;

    // ---- Consistência visual ---------------------------------------------
    const fontCount = d.fontFamilies.length;
    checks.push(check('typography', 'Consistência tipográfica', scale(fontCount, 3, 8), 1.5, `${fontCount} família(s) de fonte`));

    if (fontCount > 4) {
      issues.push(
        issue({
          id: 'ux-too-many-fonts',
          title: `${fontCount} famílias de fonte diferentes`,
          description:
            'Muitas fontes fragmentam a identidade visual e aumentam o peso da página, já que cada família exige o download de seus próprios arquivos.',
          severity: 'low',
          impact: 'baixo',
          difficulty: 'media',
          minutes: 60,
          fix: 'Reduza para 2 famílias (uma para títulos, outra para o corpo) e use pesos diferentes da mesma família para criar variação.',
          gain: 'Identidade visual mais coesa e menos bytes de fonte.',
          evidence: d.fontFamilies,
        }),
      );
    }

    checks.push(check('color-palette', 'Paleta de cores contida', scale(d.colorCount, 8, 25), 1, `${d.colorCount} cor(es) de texto`));

    // ---- Navegação --------------------------------------------------------
    checks.push(check('nav', 'Navegação principal presente', d.navElements > 0 ? 1 : 0, 2, `${d.navElements} elemento(s) <nav>`));

    if (d.navElements === 0) {
      issues.push(
        issue({
          id: 'ux-no-nav',
          title: 'Sem elemento de navegação <nav>',
          description: 'Não foi identificada uma navegação principal semanticamente marcada, o que dificulta a orientação do usuário e a compreensão da estrutura do site.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 20,
          fix: 'Envolva o menu principal em <nav> e adicione aria-label quando houver mais de um bloco de navegação.',
          gain: 'Estrutura de navegação clara para usuários e para tecnologia assistiva.',
        }),
      );
    }

    const internalLinks = d.links.filter((l) => l.internal).length;
    checks.push(check('internal-nav', 'Links internos suficientes', scale(internalLinks, 8, 2), 1, `${internalLinks} link(s)`));

    // ---- Hierarquia visual ------------------------------------------------
    const h1 = d.headings.filter((h) => h.level === 1).length;
    const h2 = d.headings.filter((h) => h.level === 2).length;
    const hierarchyScore = h1 === 1 ? (h2 > 0 ? 1 : 0.7) : h1 === 0 ? 0.2 : 0.5;
    checks.push(check('hierarchy', 'Hierarquia visual clara', hierarchyScore, 2, `${h1} H1, ${h2} H2`));

    // ---- CTAs -------------------------------------------------------------
    const ctas = d.ctaCandidates.length;
    checks.push(check('cta', 'Chamadas para ação identificáveis', ctas > 0 ? Math.min(1, ctas / 2) : 0, 2, `${ctas} CTA(s)`));

    if (ctas === 0 && d.buttons === 0) {
      issues.push(
        issue({
          id: 'ux-no-cta',
          title: 'Nenhuma chamada para ação identificada',
          description: 'A página não apresenta botões ou links de ação evidentes — o usuário chega, lê, e não sabe qual é o próximo passo.',
          severity: 'medium',
          impact: 'alto',
          difficulty: 'media',
          minutes: 60,
          fix: 'Adicione uma CTA principal visível na primeira dobra, com verbo de ação claro ("Começar agora", "Solicitar demonstração") e contraste destacado.',
          gain: 'Aumento direto na taxa de conversão.',
        }),
      );
    }

    const genericCtas = d.ctaCandidates.filter((t) => /^(clique aqui|enviar|ok|continuar|aqui)$/i.test(t.trim()));
    checks.push(check('cta-quality', 'CTAs com texto descritivo', ctas === 0 ? 0.5 : 1 - genericCtas.length / ctas, 1, `${genericCtas.length} genérico(s)`));

    if (genericCtas.length > 0) {
      recommendations.push(
        `Substitua CTAs genéricas (${[...new Set(genericCtas)].slice(0, 3).join(', ')}) por textos que descrevam o resultado da ação.`,
      );
    }

    // ---- Formulários ------------------------------------------------------
    const forms = d.forms;
    const formsWithoutSubmit = forms.filter((f) => !f.hasSubmit);
    const longForms = forms.filter((f) => f.fields > 7);

    checks.push(check('forms-submit', 'Formulários com botão de envio', forms.length === 0 ? 1 : 1 - formsWithoutSubmit.length / forms.length, 1, `${formsWithoutSubmit.length} sem botão`));
    checks.push(check('forms-length', 'Formulários com tamanho razoável', forms.length === 0 ? 1 : 1 - longForms.length / forms.length, 1, `${longForms.length} formulário(s) longo(s)`));

    if (formsWithoutSubmit.length > 0) {
      issues.push(
        issue({
          id: 'ux-form-no-submit',
          title: `${formsWithoutSubmit.length} formulário(s) sem botão de envio visível`,
          description: 'Formulários que dependem apenas da tecla Enter deixam parte dos usuários sem saber como concluir o preenchimento.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 20,
          fix: 'Adicione um <button type="submit"> explícito a cada formulário.',
          gain: 'Menos abandonos no preenchimento.',
        }),
      );
    }

    if (longForms.length > 0) {
      issues.push(
        issue({
          id: 'ux-long-forms',
          title: `${longForms.length} formulário(s) com mais de 7 campos`,
          description: `O maior tem ${Math.max(...longForms.map((f) => f.fields))} campos. Cada campo adicional reduz mensuravelmente a taxa de conclusão.`,
          severity: 'low',
          impact: 'medio',
          difficulty: 'media',
          minutes: 90,
          fix: 'Reduza aos campos realmente necessários, agrupe o restante em etapas, e colete dados complementares após a conversão inicial.',
          gain: 'Aumento típico de 10% a 25% na taxa de conclusão do formulário.',
        }),
      );
    }

    // ---- Tempo até interação ---------------------------------------------
    const tbt = ctx.desktop.metrics.tbt;
    const inp = ctx.desktop.metrics.inp;
    checks.push(check('interactivity', 'Tempo até a página responder', scale(tbt, 200, 600), 2, formatMs(tbt)));
    checks.push(check('inp', 'Resposta à interação (INP)', scale(inp, 200, 500), 1.5, formatMs(inp)));

    if (tbt !== null && tbt > 400) {
      issues.push(
        issue({
          id: 'ux-slow-interaction',
          title: `Página fica ${formatMs(tbt)} sem responder durante o carregamento`,
          description: 'Cliques feitos nessa janela são enfileirados ou perdidos, e o usuário percebe a interface como travada.',
          severity: 'medium',
          impact: 'alto',
          difficulty: 'dificil',
          minutes: 120,
          fix: 'Adie a execução de scripts não essenciais, quebre tarefas longas em blocos com scheduler.yield() ou setTimeout, e hidrate componentes sob demanda.',
          gain: 'Interface responsiva desde o primeiro instante visível.',
        }),
      );
    }

    // ---- Elementos clicáveis ---------------------------------------------
    checks.push(check('clickable', 'Elementos interativos presentes', d.buttons + d.links.length > 0 ? 1 : 0, 1, `${d.buttons} botão(ões), ${d.links.length} link(s)`));

    // ---- Rodapé -----------------------------------------------------------
    const hasFooter = (d.semanticTags.footer ?? 0) > 0;
    checks.push(check('footer', 'Rodapé estruturado', hasFooter ? 1 : 0.5, 0.5, hasFooter ? 'presente' : 'ausente'));

    if (!hasFooter) {
      recommendations.push('Adicione um <footer> com contato, políticas e links institucionais — é onde o usuário procura sinais de credibilidade.');
    }

    return {
      score: scoreFromChecks(checks),
      checks,
      issues,
      recommendations,
      evidence: {
        fontFamilies: d.fontFamilies,
        colorCount: d.colorCount,
        navElements: d.navElements,
        headings: { h1, h2 },
        ctas: d.ctaCandidates,
        forms,
        buttons: d.buttons,
        interactivity: { tbt, inp },
      },
    };
  },
};

export default plugin;
