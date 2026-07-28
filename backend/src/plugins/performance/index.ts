import { scale, scoreFromChecks } from '../../core/scoring.js';
import type { AuditContext, AuditPlugin, Check, PluginIssue } from '../../core/types.js';
import { check, formatBytes, formatMs, issue } from '../helpers.js';

const COMPRESSIBLE = ['text/html', 'text/css', 'application/javascript', 'text/javascript', 'application/json', 'image/svg+xml', 'text/plain'];

const plugin: AuditPlugin = {
  id: 'performance',
  name: 'Performance',
  description: 'Core Web Vitals, peso dos recursos, estratégia de carregamento e eficiência de rede.',
  category: 'performance',
  weight: 3,
  checks: [
    'LCP', 'CLS', 'INP', 'FCP', 'TTFB', 'Speed Index', 'Total Blocking Time',
    'Peso de imagens', 'Peso de JavaScript', 'Peso de CSS', 'Fontes', 'Vídeos', 'SVG',
    'Lazy loading', 'Preload', 'Prefetch', 'Recursos bloqueantes', 'CSS crítico',
    'Bundle size', 'Número de requisições', 'Compressão', 'Brotli/Gzip', 'Cache',
  ],

  async run(ctx: AuditContext) {
    const checks: Check[] = [];
    const issues: PluginIssue[] = [];
    const recommendations: string[] = [];
    const m = ctx.desktop.metrics;

    // ---- Core Web Vitals --------------------------------------------------
    checks.push(check('lcp', 'Largest Contentful Paint', scale(m.lcp, 2500, 4000), 3, formatMs(m.lcp)));
    checks.push(check('cls', 'Cumulative Layout Shift', scale(m.cls, 0.1, 0.25), 2, m.cls?.toFixed(3) ?? 'n/d'));
    checks.push(check('inp', 'Interaction to Next Paint', scale(m.inp, 200, 500), 2, formatMs(m.inp)));
    checks.push(check('fcp', 'First Contentful Paint', scale(m.fcp, 1800, 3000), 2, formatMs(m.fcp)));
    checks.push(check('ttfb', 'Time To First Byte', scale(m.ttfb, 800, 1800), 2, formatMs(m.ttfb)));
    checks.push(check('si', 'Speed Index', scale(m.speedIndex, 3400, 5800), 1, formatMs(m.speedIndex)));
    checks.push(check('tbt', 'Total Blocking Time', scale(m.tbt, 200, 600), 2, formatMs(m.tbt)));

    if (m.lcp !== null && m.lcp > 2500) {
      issues.push(
        issue({
          id: 'perf-lcp',
          title: `LCP de ${formatMs(m.lcp)} acima do recomendado`,
          description:
            'O maior elemento visível leva mais de 2,5 s para aparecer. É a métrica que o Google mais pesa na avaliação de velocidade percebida.',
          severity: m.lcp > 4000 ? 'critical' : 'high',
          impact: 'alto',
          difficulty: 'media',
          minutes: 60,
          fix: 'Identifique o elemento LCP (normalmente a imagem principal ou o título). Aplique preload nele, sirva imagens em WebP/AVIF com dimensões corretas, e remova recursos bloqueantes antes dele.',
          gain: `Redução aproximada de ${((m.lcp - 2200) / 1000).toFixed(1)} s no carregamento percebido.`,
          evidence: [`LCP medido: ${formatMs(m.lcp)}`, `Meta: até 2500 ms`],
        }),
      );
    }

    if (m.cls !== null && m.cls > 0.1) {
      issues.push(
        issue({
          id: 'perf-cls',
          title: `Layout instável (CLS ${m.cls.toFixed(3)})`,
          description:
            'Elementos mudam de posição durante o carregamento, causando cliques errados e sensação de instabilidade.',
          severity: m.cls > 0.25 ? 'high' : 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 30,
          fix: 'Declare width e height em todas as imagens e iframes, reserve espaço para banners e anúncios, e use font-display: optional ou swap com fallback métrico compatível.',
          gain: 'CLS abaixo de 0,1 e menos cliques acidentais.',
          evidence: [`CLS medido: ${m.cls.toFixed(3)}`],
        }),
      );
    }

    if (m.tbt !== null && m.tbt > 200) {
      issues.push(
        issue({
          id: 'perf-tbt',
          title: `JavaScript bloqueia a thread principal por ${formatMs(m.tbt)}`,
          description: `Foram detectadas ${m.longTasks} tarefas longas. Enquanto elas executam, a página não responde a cliques nem rolagem.`,
          severity: m.tbt > 600 ? 'high' : 'medium',
          impact: 'alto',
          difficulty: 'dificil',
          minutes: 180,
          fix: 'Divida o bundle com code splitting, adie scripts não críticos com defer, mova processamento pesado para Web Workers e remova bibliotecas não utilizadas.',
          gain: 'Interatividade mais rápida e INP dentro da faixa boa.',
          evidence: [`TBT: ${formatMs(m.tbt)}`, `Tarefas longas: ${m.longTasks}`],
        }),
      );
    }

    if (m.ttfb !== null && m.ttfb > 800) {
      issues.push(
        issue({
          id: 'perf-ttfb',
          title: `Servidor demora ${formatMs(m.ttfb)} para responder`,
          description: 'O TTFB alto atrasa todo o restante do carregamento — nada pode começar antes da primeira resposta.',
          severity: m.ttfb > 1800 ? 'high' : 'medium',
          impact: 'alto',
          difficulty: 'media',
          minutes: 90,
          fix: 'Ative cache de página no servidor, use um CDN, otimize consultas ao banco e verifique se há redirecionamentos desnecessários antes da resposta.',
          gain: `Redução de até ${((m.ttfb - 500) / 1000).toFixed(1)} s em todas as páginas.`,
          evidence: [`TTFB: ${formatMs(m.ttfb)}`],
        }),
      );
    }

    // ---- Peso dos recursos ------------------------------------------------
    const byType = (types: string[]) =>
      ctx.resources.filter((r) => types.includes(r.type) || types.some((t) => r.mimeType.includes(t)));

    const images = byType(['image']);
    const scripts = byType(['script', 'javascript']);
    const styles = byType(['stylesheet', 'text/css']);
    const fonts = byType(['font']);
    const media = byType(['media', 'video']);

    const sum = (list: typeof ctx.resources) => list.reduce((s, r) => s + (r.transferSize || 0), 0);
    const totalBytes = sum(ctx.resources);
    const imageBytes = sum(images);
    const scriptBytes = sum(scripts);
    const styleBytes = sum(styles);
    const fontBytes = sum(fonts);
    const mediaBytes = sum(media);

    checks.push(check('total-weight', 'Peso total da página', scale(totalBytes, 1_000_000, 4_000_000), 2, formatBytes(totalBytes)));
    checks.push(check('img-weight', 'Peso das imagens', scale(imageBytes, 500_000, 2_500_000), 2, formatBytes(imageBytes)));
    checks.push(check('js-weight', 'Peso do JavaScript', scale(scriptBytes, 300_000, 1_200_000), 2, formatBytes(scriptBytes)));
    checks.push(check('css-weight', 'Peso do CSS', scale(styleBytes, 100_000, 400_000), 1, formatBytes(styleBytes)));
    checks.push(check('font-weight', 'Peso das fontes', scale(fontBytes, 150_000, 600_000), 1, formatBytes(fontBytes)));
    checks.push(check('media-weight', 'Peso de vídeo/mídia', scale(mediaBytes, 0, 5_000_000), 1, formatBytes(mediaBytes)));
    checks.push(check('requests', 'Número de requisições', scale(ctx.resources.length, 50, 150), 1, String(ctx.resources.length)));

    // Imagens individuais pesadas
    const heavyImages = images
      .filter((r) => r.transferSize > 300_000)
      .sort((a, b) => b.transferSize - a.transferSize)
      .slice(0, 8);

    if (heavyImages.length > 0) {
      const worst = heavyImages[0];
      issues.push(
        issue({
          id: 'perf-heavy-images',
          title: `${heavyImages.length} imagem(ns) acima de 300 KB`,
          description: `A maior tem ${formatBytes(worst.transferSize)}. Imagens pesadas são a causa mais comum de LCP alto, especialmente em conexões móveis.`,
          severity: worst.transferSize > 1_000_000 ? 'high' : 'medium',
          impact: 'alto',
          difficulty: 'facil',
          minutes: 15 * heavyImages.length,
          fix: 'Converta para WebP ou AVIF, redimensione para o tamanho real de exibição, e sirva variantes responsivas com srcset.',
          gain: `Economia estimada de ${formatBytes(heavyImages.reduce((s, r) => s + r.transferSize * 0.6, 0))} e redução de cerca de ${(heavyImages.reduce((s, r) => s + r.transferSize * 0.6, 0) / 400_000).toFixed(1)} s em 4G.`,
          evidence: heavyImages.map((r) => `${formatBytes(r.transferSize)} — ${r.url.slice(0, 120)}`),
        }),
      );
    }

    // Imagens servidas maiores que o espaço de exibição.
    // SVG é vetorial — não há desperdício de bytes por dimensão, então é ignorado.
    const oversized = ctx.dom.images.filter(
      (img) =>
        img.format !== 'svg' &&
        img.naturalWidth &&
        img.displayWidth &&
        img.displayWidth > 0 &&
        img.naturalWidth > img.displayWidth * 2,
    );

    checks.push(check('img-sizing', 'Imagens dimensionadas corretamente', oversized.length === 0 ? 1 : Math.max(0, 1 - oversized.length / 10), 1, `${oversized.length} superdimensionada(s)`));

    if (oversized.length > 0) {
      issues.push(
        issue({
          id: 'perf-oversized-images',
          title: `${oversized.length} imagem(ns) muito maior(es) que o espaço exibido`,
          description: 'A imagem é baixada em resolução alta e reduzida pelo navegador — os bytes extras são desperdiçados.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 10 * Math.min(oversized.length, 6),
          fix: 'Gere versões nas dimensões reais de exibição e use srcset com sizes para servir a variante adequada a cada tela.',
          gain: 'Redução de 40% a 70% no peso das imagens afetadas.',
          evidence: oversized.slice(0, 6).map((i) => `${i.naturalWidth}px natural × ${i.displayWidth}px exibido — ${i.src.slice(0, 100)}`),
        }),
      );
    }

    // Formatos modernos
    const legacyFormats = ctx.dom.images.filter((i) => i.format && ['jpg', 'jpeg', 'png', 'gif'].includes(i.format));
    checks.push(check('img-format', 'Formatos modernos de imagem', ctx.dom.images.length === 0 ? 1 : 1 - legacyFormats.length / ctx.dom.images.length, 1, `${legacyFormats.length} em formato antigo`));

    if (legacyFormats.length > 3) {
      issues.push(
        issue({
          id: 'perf-legacy-image-format',
          title: `${legacyFormats.length} imagens em JPEG/PNG/GIF`,
          description: 'WebP e AVIF entregam a mesma qualidade visual com 25% a 50% menos bytes.',
          severity: 'low',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 45,
          fix: 'Converta as imagens para WebP (ou AVIF) e use a tag <picture> com fallback para navegadores antigos.',
          gain: 'Redução média de 30% no peso total de imagens.',
          evidence: legacyFormats.slice(0, 6).map((i) => i.src.slice(0, 110)),
        }),
      );
    }

    // ---- Estratégia de carregamento --------------------------------------
    const belowFoldImages = ctx.dom.images.slice(3);
    const lazyCount = belowFoldImages.filter((i) => i.loading === 'lazy').length;
    const lazyRatio = belowFoldImages.length === 0 ? 1 : lazyCount / belowFoldImages.length;

    checks.push(check('lazy', 'Lazy loading em imagens abaixo da dobra', lazyRatio, 1, `${lazyCount}/${belowFoldImages.length}`));
    checks.push(check('preload', 'Uso de preload', ctx.dom.preloads.length > 0 ? 1 : 0.4, 1, `${ctx.dom.preloads.length} recurso(s)`));
    checks.push(check('preconnect', 'Uso de preconnect/dns-prefetch', ctx.dom.preconnects.length > 0 ? 1 : 0.6, 0.5, `${ctx.dom.preconnects.length}`));
    checks.push(check('prefetch', 'Uso de prefetch', ctx.dom.prefetches.length > 0 ? 1 : 0.7, 0.5, `${ctx.dom.prefetches.length}`));

    const blocking = ctx.dom.renderBlockingCss + ctx.dom.renderBlockingJs;
    checks.push(check('render-blocking', 'Recursos bloqueantes de renderização', scale(blocking, 2, 10), 2, `${blocking} recurso(s)`));

    if (belowFoldImages.length > 3 && lazyRatio < 0.5) {
      issues.push(
        issue({
          id: 'perf-no-lazy',
          title: 'Imagens abaixo da dobra sem lazy loading',
          description: `${belowFoldImages.length - lazyCount} imagens fora da tela inicial são baixadas imediatamente, competindo com o conteúdo visível.`,
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 20,
          fix: 'Adicione loading="lazy" às imagens que não aparecem na primeira tela. Nunca aplique na imagem do LCP.',
          gain: 'Menos bytes no carregamento inicial e LCP mais rápido.',
        }),
      );
    }

    if (blocking > 4) {
      issues.push(
        issue({
          id: 'perf-render-blocking',
          title: `${blocking} recursos bloqueiam a renderização`,
          description: `${ctx.dom.renderBlockingCss} folhas de estilo e ${ctx.dom.renderBlockingJs} scripts síncronos no <head> impedem a página de aparecer até serem baixados e processados.`,
          severity: 'high',
          impact: 'alto',
          difficulty: 'media',
          minutes: 60,
          fix: 'Inline o CSS crítico da primeira dobra, carregue o restante com media="print" onload, e adicione defer ou async aos scripts do head.',
          gain: 'FCP e LCP tipicamente 0,5 s a 1,5 s mais rápidos.',
          evidence: [`CSS bloqueante: ${ctx.dom.renderBlockingCss}`, `JS bloqueante: ${ctx.dom.renderBlockingJs}`],
        }),
      );
    }

    if (ctx.dom.preloads.length === 0 && m.lcp !== null && m.lcp > 2000) {
      recommendations.push('Aplique <link rel="preload"> no recurso responsável pelo LCP (imagem principal ou fonte do título).');
    }

    // ---- Rede: compressão e cache ----------------------------------------
    const compressible = ctx.resources.filter(
      (r) => COMPRESSIBLE.some((t) => r.mimeType.includes(t)) && r.transferSize > 1024,
    );
    const compressed = compressible.filter((r) => r.encoding === 'br' || r.encoding === 'gzip');
    const brotli = compressible.filter((r) => r.encoding === 'br');
    const compressionRatio = compressible.length === 0 ? 1 : compressed.length / compressible.length;

    checks.push(check('compression', 'Compressão de texto', compressionRatio, 2, `${compressed.length}/${compressible.length}`));
    checks.push(check('brotli', 'Brotli habilitado', compressible.length === 0 ? 1 : brotli.length / compressible.length, 1, `${brotli.length} recurso(s)`));

    const cacheable = ctx.resources.filter((r) => ['image', 'script', 'stylesheet', 'font'].includes(r.type));
    const wellCached = cacheable.filter((r) => {
      const cc = r.cacheControl ?? '';
      const maxAge = cc.match(/max-age=(\d+)/);
      return maxAge ? Number(maxAge[1]) >= 86_400 : false;
    });
    const cacheRatio = cacheable.length === 0 ? 1 : wellCached.length / cacheable.length;
    checks.push(check('cache', 'Cache de recursos estáticos', cacheRatio, 2, `${wellCached.length}/${cacheable.length}`));

    if (compressionRatio < 0.9 && compressible.length > 0) {
      const uncompressed = compressible.filter((r) => !r.encoding);
      issues.push(
        issue({
          id: 'perf-no-compression',
          title: `${uncompressed.length} recursos de texto sem compressão`,
          description: 'HTML, CSS e JavaScript sem Gzip/Brotli trafegam com 3 a 5 vezes mais bytes que o necessário.',
          severity: 'high',
          impact: 'alto',
          difficulty: 'facil',
          minutes: 20,
          fix: 'Ative Brotli (com fallback Gzip) no servidor web ou no CDN. No nginx: `brotli on; gzip on;` para os tipos MIME de texto.',
          gain: `Economia estimada de ${formatBytes(uncompressed.reduce((s, r) => s + r.transferSize * 0.7, 0))} por visita.`,
          evidence: uncompressed.slice(0, 6).map((r) => `${formatBytes(r.transferSize)} — ${r.url.slice(0, 110)}`),
        }),
      );
    }

    if (cacheRatio < 0.7 && cacheable.length > 5) {
      issues.push(
        issue({
          id: 'perf-weak-cache',
          title: 'Recursos estáticos com cache curto ou ausente',
          description: `${cacheable.length - wellCached.length} arquivos estáticos não têm Cache-Control com max-age de ao menos 1 dia, forçando novo download a cada visita.`,
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 25,
          fix: 'Configure Cache-Control: public, max-age=31536000, immutable para arquivos versionados (com hash no nome) e valores menores para HTML.',
          gain: 'Visitas recorrentes praticamente instantâneas.',
        }),
      );
    }

    if (scriptBytes > 800_000) {
      issues.push(
        issue({
          id: 'perf-bundle-size',
          title: `Bundle JavaScript de ${formatBytes(scriptBytes)}`,
          description: 'Bundles grandes precisam ser baixados, parseados e executados antes da página ficar interativa.',
          severity: 'high',
          impact: 'alto',
          difficulty: 'dificil',
          minutes: 240,
          fix: 'Ative tree shaking, faça code splitting por rota, carregue componentes pesados sob demanda e audite dependências com o analisador do bundler.',
          gain: 'Redução típica de 30% a 60% no JavaScript inicial.',
          evidence: [`Total de JS: ${formatBytes(scriptBytes)}`, `Arquivos: ${scripts.length}`],
        }),
      );
    }

    return {
      score: scoreFromChecks(checks),
      checks,
      issues,
      recommendations,
      evidence: {
        metrics: m,
        mobileMetrics: ctx.mobile.metrics,
        totalBytes,
        breakdown: { imageBytes, scriptBytes, styleBytes, fontBytes, mediaBytes },
        requestCount: ctx.resources.length,
      },
    };
  },
};

export default plugin;
