import { scale, scoreFromChecks } from '../../core/scoring.js';
import type { AuditContext, AuditPlugin, Check, PluginIssue } from '../../core/types.js';
import { check, formatMs, issue } from '../helpers.js';

const plugin: AuditPlugin = {
  id: 'mobile',
  name: 'Mobile',
  description: 'Viewport, responsividade, tamanhos de fonte e de alvos de toque, CLS mobile e imagens responsivas.',
  category: 'mobile',
  weight: 2,
  checks: [
    'Meta viewport', 'Responsividade (sem rolagem horizontal)', 'Tamanho das fontes',
    'Tamanho dos botões', 'Espaçamento entre alvos', 'CLS em mobile',
    'LCP em mobile', 'Imagens responsivas (srcset)',
  ],

  async run(ctx: AuditContext) {
    const checks: Check[] = [];
    const issues: PluginIssue[] = [];
    const recommendations: string[] = [];
    const d = ctx.dom;
    const m = ctx.mobile;

    // ---- Viewport ---------------------------------------------------------
    const viewport = d.viewport ?? '';
    const hasWidthDevice = /width\s*=\s*device-width/i.test(viewport);
    const blocksZoom = /user-scalable\s*=\s*(no|0)/i.test(viewport) || /maximum-scale\s*=\s*1(\.0)?\b/i.test(viewport);

    checks.push(check('viewport', 'Meta viewport configurada', hasWidthDevice ? 1 : viewport ? 0.4 : 0, 3, viewport || 'ausente'));
    checks.push(check('zoom', 'Zoom permitido', blocksZoom ? 0 : 1, 1.5, blocksZoom ? 'bloqueado' : 'permitido'));

    if (!hasWidthDevice) {
      issues.push(
        issue({
          id: 'mobile-no-viewport',
          title: viewport ? 'Meta viewport mal configurada' : 'Meta viewport ausente',
          description:
            'Sem width=device-width, o navegador móvel renderiza a página com largura de desktop (980px) e reduz tudo proporcionalmente, deixando o texto ilegível.',
          severity: 'critical',
          impact: 'alto',
          difficulty: 'facil',
          minutes: 5,
          fix: 'Adicione no <head>: <meta name="viewport" content="width=device-width, initial-scale=1">',
          gain: 'Renderização correta em dispositivos móveis — pré-requisito para qualquer otimização mobile.',
          evidence: viewport ? [viewport] : undefined,
        }),
      );
    }

    if (blocksZoom) {
      issues.push(
        issue({
          id: 'mobile-zoom-blocked',
          title: 'Zoom desabilitado no viewport',
          description: 'Impedir o zoom bloqueia um recurso essencial de acessibilidade para pessoas com baixa visão.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 5,
          fix: 'Remova user-scalable=no e maximum-scale=1 da meta viewport.',
          gain: 'Conformidade com WCAG 1.4.4 (redimensionamento de texto).',
          evidence: [viewport],
        }),
      );
    }

    // ---- Responsividade ---------------------------------------------------
    checks.push(check('no-overflow', 'Sem rolagem horizontal', m.horizontalOverflow ? 0 : 1, 3, m.horizontalOverflow ? `${m.overflowingSelectors.length} elemento(s) estourando` : 'ok'));

    if (m.horizontalOverflow) {
      issues.push(
        issue({
          id: 'mobile-horizontal-scroll',
          title: 'Página tem rolagem horizontal em mobile',
          description: `${m.overflowingSelectors.length} elemento(s) ultrapassam a largura da tela de ${m.width}px, forçando o usuário a rolar lateralmente para ler o conteúdo.`,
          severity: 'high',
          impact: 'alto',
          difficulty: 'media',
          minutes: 60,
          fix:
            'Identifique os elementos listados e aplique max-width: 100%, box-sizing: border-box e width: auto. Tabelas e blocos de código devem ficar em um contêiner com overflow-x: auto próprio.',
          gain: 'Leitura confortável em qualquer largura de tela.',
          evidence: m.overflowingSelectors,
        }),
      );
    }

    // ---- Fontes -----------------------------------------------------------
    const smallFonts = m.smallFonts.length;
    checks.push(check('font-size', 'Fontes legíveis (≥ 12px)', smallFonts === 0 ? 1 : Math.max(0, 1 - smallFonts / 10), 2, `${smallFonts} elemento(s) com fonte pequena`));

    if (smallFonts > 0) {
      issues.push(
        issue({
          id: 'mobile-small-fonts',
          title: `${smallFonts} elemento(s) com fonte menor que 12px`,
          description: 'Textos muito pequenos forçam o usuário a dar zoom para ler, o que quase sempre resulta em abandono da página.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 25,
          fix: 'Use no mínimo 16px para o corpo de texto e 14px para textos auxiliares. Prefira unidades relativas (rem) a pixels fixos.',
          gain: 'Leitura sem zoom e menor taxa de rejeição no mobile.',
          evidence: m.smallFonts.map((f) => `${f.fontSize}px — ${f.selector}`),
        }),
      );
    }

    // ---- Alvos de toque ---------------------------------------------------
    const smallTargets = m.smallTapTargets.length;
    checks.push(check('tap-targets', 'Alvos de toque com ao menos 44×44px', smallTargets === 0 ? 1 : Math.max(0, 1 - smallTargets / 12), 2, `${smallTargets} alvo(s) pequeno(s)`));

    if (smallTargets > 0) {
      issues.push(
        issue({
          id: 'mobile-small-tap-targets',
          title: `${smallTargets} alvo(s) de toque menor(es) que 44×44px`,
          description:
            'Links e botões pequenos causam toques errados. A recomendação de 44×44 px vem do tamanho médio da ponta do dedo adulto.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 30,
          fix: 'Aumente o padding dos elementos interativos até 44×44px de área clicável e garanta ao menos 8px de espaçamento entre alvos adjacentes.',
          gain: 'Menos toques errados e navegação mais fluida no celular.',
          evidence: m.smallTapTargets.map((t) => `${t.width}×${t.height}px — ${t.selector}`),
        }),
      );
    }

    // ---- Métricas mobile --------------------------------------------------
    checks.push(check('mobile-lcp', 'LCP em mobile', scale(m.metrics.lcp, 2500, 4000), 2, formatMs(m.metrics.lcp)));
    checks.push(check('mobile-cls', 'CLS em mobile', scale(m.metrics.cls, 0.1, 0.25), 2, m.metrics.cls?.toFixed(3) ?? 'n/d'));

    const desktopCls = ctx.desktop.metrics.cls ?? 0;
    const mobileCls = m.metrics.cls ?? 0;

    if (mobileCls > 0.1 && mobileCls > desktopCls * 1.5) {
      issues.push(
        issue({
          id: 'mobile-cls-regression',
          title: `Layout muito mais instável em mobile (CLS ${mobileCls.toFixed(3)} vs ${desktopCls.toFixed(3)} no desktop)`,
          description: 'O deslocamento de layout é significativamente pior no celular, sugerindo elementos que reflow apenas em telas estreitas.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'media',
          minutes: 60,
          fix: 'Reserve altura para banners, carrosséis e anúncios nos breakpoints móveis, e declare dimensões em todas as imagens.',
          gain: 'CLS mobile dentro da faixa boa e menos cliques acidentais.',
          evidence: [`CLS mobile: ${mobileCls.toFixed(3)}`, `CLS desktop: ${desktopCls.toFixed(3)}`],
        }),
      );
    }

    // ---- Imagens responsivas ---------------------------------------------
    const withSrcset = d.images.filter((i) => i.hasSrcset).length;
    const responsiveRatio = d.images.length === 0 ? 1 : withSrcset / d.images.length;
    checks.push(check('responsive-images', 'Imagens com srcset', responsiveRatio, 1.5, `${withSrcset}/${d.images.length}`));

    if (d.images.length >= 3 && responsiveRatio < 0.4) {
      issues.push(
        issue({
          id: 'mobile-no-srcset',
          title: 'Imagens sem variantes responsivas',
          description: `${d.images.length - withSrcset} de ${d.images.length} imagens são servidas em tamanho único. No celular, isso significa baixar a versão de desktop em uma tela de 390px.`,
          severity: 'medium',
          impact: 'alto',
          difficulty: 'media',
          minutes: 60,
          fix: 'Gere variantes em múltiplas larguras e use srcset com sizes, ou <picture> com <source media> por breakpoint.',
          gain: 'Redução típica de 50% a 70% no peso das imagens em dispositivos móveis.',
        }),
      );
    }

    if (m.metrics.lcp !== null && ctx.desktop.metrics.lcp !== null && m.metrics.lcp > ctx.desktop.metrics.lcp * 1.6) {
      recommendations.push(
        `O LCP mobile (${formatMs(m.metrics.lcp)}) é bem pior que o desktop (${formatMs(ctx.desktop.metrics.lcp)}). Priorize a otimização de imagens e a redução de JavaScript no caminho crítico móvel.`,
      );
    }

    return {
      score: scoreFromChecks(checks),
      checks,
      issues,
      recommendations,
      evidence: {
        viewport,
        mobileMetrics: m.metrics,
        desktopMetrics: ctx.desktop.metrics,
        horizontalOverflow: m.horizontalOverflow,
        overflowingSelectors: m.overflowingSelectors,
        smallTapTargets: m.smallTapTargets,
        smallFonts: m.smallFonts,
        responsiveImages: { withSrcset, total: d.images.length },
      },
    };
  },
};

export default plugin;
