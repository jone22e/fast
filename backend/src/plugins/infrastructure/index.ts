import { scale, scoreFromChecks } from '../../core/scoring.js';
import type { AuditContext, AuditPlugin, Check, PluginIssue } from '../../core/types.js';
import { check, formatMs, issue } from '../helpers.js';

const plugin: AuditPlugin = {
  id: 'infrastructure',
  name: 'Infraestrutura',
  description: 'Protocolo HTTP, compressão, cache, CDN, DNS, IPv6 e cadeia de redirecionamentos.',
  category: 'infrastructure',
  weight: 2,
  checks: [
    'HTTP/2', 'HTTP/3', 'Brotli', 'Gzip', 'Keep-Alive', 'Cache-Control',
    'ETag / Last-Modified', 'CDN', 'DNS', 'IPv6', 'Redirecionamentos', 'Compressão do HTML',
  ],

  async run(ctx: AuditContext) {
    const checks: Check[] = [];
    const issues: PluginIssue[] = [];
    const recommendations: string[] = [];
    const h = ctx.headers;
    const net = ctx.network;

    // ---- Protocolo --------------------------------------------------------
    // Chromium negocia HTTP/2 sempre que o servidor suporta; a ausência de
    // cabeçalhos de conexão HTTP/1 é um indicador confiável.
    const looksHttp1 = Boolean(h['connection'] || h['transfer-encoding'] === 'chunked' && h['connection']);
    const http2 = !looksHttp1;
    const http3 = net.protocol === 'h3' || Boolean(h['alt-svc']?.includes('h3'));

    checks.push(check('http2', 'HTTP/2 disponível', http2 ? 1 : 0, 2, http2 ? 'sim' : 'aparentemente HTTP/1.1'));
    checks.push(check('http3', 'HTTP/3 (QUIC) disponível', http3 ? 1 : 0.5, 1, http3 ? 'sim' : 'não anunciado'));

    if (!http2) {
      issues.push(
        issue({
          id: 'infra-no-http2',
          title: 'Servidor aparentemente em HTTP/1.1',
          description:
            'HTTP/1.1 limita as requisições paralelas por conexão e não tem multiplexação nem compressão de cabeçalhos, atrasando páginas com muitos recursos.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'media',
          minutes: 45,
          fix: 'Ative HTTP/2 no servidor web (no nginx: `listen 443 ssl; http2 on;`) ou coloque um CDN na frente, que já entrega HTTP/2 e HTTP/3.',
          gain: 'Carregamento paralelo mais eficiente, especialmente em páginas com muitos arquivos.',
        }),
      );
    }

    if (!http3) {
      recommendations.push('Considere habilitar HTTP/3 (QUIC) — reduz a latência de estabelecimento de conexão, sobretudo em redes móveis.');
    }

    // ---- Compressão -------------------------------------------------------
    const htmlResource = ctx.resources.find((r) => r.mimeType.includes('text/html'));
    const htmlEncoding = htmlResource?.encoding ?? h['content-encoding'];
    const brotli = htmlEncoding === 'br';
    const gzip = htmlEncoding === 'gzip' || htmlEncoding === 'deflate';

    checks.push(check('compression-html', 'HTML comprimido', brotli || gzip ? 1 : 0, 2.5, htmlEncoding ?? 'sem compressão'));
    checks.push(check('brotli', 'Brotli habilitado', brotli ? 1 : gzip ? 0.6 : 0, 1.5, brotli ? 'sim' : gzip ? 'apenas gzip' : 'não'));

    if (!brotli && !gzip) {
      issues.push(
        issue({
          id: 'infra-no-compression',
          title: 'HTML servido sem compressão',
          description: 'O documento principal trafega sem Gzip nem Brotli, tipicamente 3 a 4 vezes maior que o necessário.',
          severity: 'high',
          impact: 'alto',
          difficulty: 'facil',
          minutes: 20,
          fix: 'Ative a compressão no servidor. No nginx: `gzip on; gzip_types text/html text/css application/javascript application/json image/svg+xml;` e, se disponível, o módulo brotli.',
          gain: 'Redução de 60% a 80% no peso dos arquivos de texto.',
        }),
      );
    } else if (!brotli) {
      recommendations.push('Ative Brotli além do Gzip — comprime cerca de 15% a 20% melhor em arquivos de texto.');
    }

    // ---- Cache ------------------------------------------------------------
    const cacheControl = h['cache-control'];
    const etag = h['etag'];
    const lastModified = h['last-modified'];

    checks.push(check('cache-control', 'Cache-Control no documento', cacheControl ? 1 : 0, 1.5, cacheControl ?? 'ausente'));
    checks.push(check('validators', 'ETag ou Last-Modified', etag || lastModified ? 1 : 0, 1, etag ? 'ETag' : lastModified ? 'Last-Modified' : 'ausente'));

    if (!cacheControl) {
      issues.push(
        issue({
          id: 'infra-no-cache-control',
          title: 'Documento HTML sem Cache-Control',
          description: 'Sem diretiva explícita, cada navegador e proxy aplica sua própria heurística de cache — o comportamento fica imprevisível.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 15,
          fix: 'Defina Cache-Control explicitamente. Para HTML dinâmico: `no-cache` com ETag. Para HTML estático: `public, max-age=300, must-revalidate`.',
          gain: 'Comportamento de cache previsível e revalidação eficiente.',
        }),
      );
    }

    if (!etag && !lastModified) {
      recommendations.push('Adicione ETag ou Last-Modified para permitir revalidação com resposta 304 (sem retransmitir o corpo).');
    }

    // ---- Keep-Alive -------------------------------------------------------
    const keepAlive = !h['connection'] || h['connection'].toLowerCase().includes('keep-alive');
    checks.push(check('keep-alive', 'Conexões persistentes', keepAlive ? 1 : 0, 1, keepAlive ? 'sim' : 'Connection: close'));

    // ---- CDN --------------------------------------------------------------
    checks.push(check('cdn', 'Distribuição via CDN', net.cdn ? 1 : 0.4, 1.5, net.cdn ?? 'não detectado'));

    if (!net.cdn) {
      issues.push(
        issue({
          id: 'infra-no-cdn',
          title: 'Sem CDN detectado',
          description:
            'Sem uma rede de distribuição, todos os visitantes buscam os arquivos no servidor de origem — usuários geograficamente distantes pagam a latência completa.',
          severity: 'low',
          impact: 'medio',
          difficulty: 'media',
          minutes: 90,
          fix: 'Coloque um CDN na frente do site (Cloudflare, Fastly, CloudFront, Bunny). Além da distribuição, a maioria entrega HTTP/3, Brotli e cache de borda automaticamente.',
          gain: 'TTFB substancialmente menor para visitantes distantes do servidor de origem.',
        }),
      );
    }

    // ---- DNS e IPv6 -------------------------------------------------------
    checks.push(check('dns', 'DNS resolvendo', net.dns.resolved ? 1 : 0, 2, `${net.ipAddresses.length} endereço(s)`));
    checks.push(check('ipv6', 'Suporte a IPv6', net.ipv6 ? 1 : 0.5, 1, net.ipv6 ? 'sim' : 'não'));
    checks.push(check('dns-redundancy', 'Redundância de endereços', net.ipAddresses.length > 1 ? 1 : 0.6, 0.5, `${net.ipAddresses.length} IP(s)`));

    if (!net.ipv6) {
      issues.push(
        issue({
          id: 'infra-no-ipv6',
          title: 'Domínio sem registro AAAA (IPv6)',
          description:
            'Uma parcela crescente das redes móveis é IPv6-only e depende de tradução NAT64 para alcançar servidores IPv4, o que adiciona latência.',
          severity: 'low',
          impact: 'baixo',
          difficulty: 'media',
          minutes: 40,
          fix: 'Adicione um registro AAAA apontando para o endereço IPv6 do servidor, ou habilite IPv6 no CDN.',
          gain: 'Conexão direta para usuários em redes IPv6.',
        }),
      );
    }

    // ---- Redirecionamentos ------------------------------------------------
    checks.push(check('redirects', 'Sem cadeia longa de redirecionamentos', ctx.redirectChain.length <= 1 ? 1 : scale(ctx.redirectChain.length, 1, 4), 1.5, `${ctx.redirectChain.length} salto(s)`));

    const temporaryRedirects = ctx.redirectChain.filter((r) => r.status === 302 || r.status === 307);
    if (temporaryRedirects.length > 0) {
      issues.push(
        issue({
          id: 'infra-temp-redirect',
          title: `${temporaryRedirects.length} redirecionamento(s) temporário(s) (302/307)`,
          description: 'Redirecionamentos permanentes devem usar 301 ou 308 — com 302 os buscadores mantêm a URL antiga indexada e não transferem autoridade.',
          severity: 'medium',
          impact: 'medio',
          difficulty: 'facil',
          minutes: 15,
          fix: 'Troque para 301 (ou 308, que preserva o método HTTP) os redirecionamentos que são definitivos.',
          gain: 'Transferência correta de autoridade para a URL final.',
          evidence: temporaryRedirects.map((r) => `${r.status} → ${r.url}`),
        }),
      );
    }

    // ---- Resposta ---------------------------------------------------------
    checks.push(check('status', 'Resposta HTTP 200', ctx.statusCode === 200 ? 1 : 0, 3, String(ctx.statusCode)));

    if (ctx.statusCode !== 200) {
      issues.push(
        issue({
          id: 'infra-bad-status',
          title: `Página respondeu HTTP ${ctx.statusCode}`,
          description: 'A URL não retorna 200 OK — buscadores não indexarão o conteúdo e usuários podem ver uma página de erro.',
          severity: 'critical',
          impact: 'alto',
          difficulty: 'media',
          minutes: 60,
          fix: 'Verifique a configuração do servidor e da aplicação para que a URL responda 200 com o conteúdo esperado.',
          gain: 'Página acessível e indexável.',
        }),
      );
    }

    const ttfb = ctx.desktop.metrics.ttfb;
    checks.push(check('server-response', 'Tempo de resposta do servidor', scale(ttfb, 500, 1500), 2, formatMs(ttfb)));

    // ---- Erros de console -------------------------------------------------
    checks.push(check('console', 'Sem erros de JavaScript no console', ctx.consoleErrors.length === 0 ? 1 : Math.max(0, 1 - ctx.consoleErrors.length / 10), 1, `${ctx.consoleErrors.length} erro(s)`));

    if (ctx.consoleErrors.length > 0) {
      issues.push(
        issue({
          id: 'infra-console-errors',
          title: `${ctx.consoleErrors.length} erro(s) de JavaScript no carregamento`,
          description: 'Erros no console indicam funcionalidades quebradas — formulários, rastreamento, componentes interativos podem não estar funcionando.',
          severity: ctx.consoleErrors.length > 5 ? 'high' : 'medium',
          impact: 'medio',
          difficulty: 'media',
          minutes: 20 * Math.min(ctx.consoleErrors.length, 5),
          fix: 'Abra o DevTools, reproduza os erros listados e corrija a origem de cada um.',
          gain: 'Funcionalidades restauradas e menos comportamento imprevisível.',
          evidence: ctx.consoleErrors.slice(0, 8),
        }),
      );
    }

    return {
      score: scoreFromChecks(checks),
      checks,
      issues,
      recommendations,
      evidence: {
        statusCode: ctx.statusCode,
        protocol: { http2, http3, altSvc: h['alt-svc'] ?? null },
        compression: htmlEncoding ?? null,
        cache: { cacheControl: cacheControl ?? null, etag: etag ?? null, lastModified: lastModified ?? null },
        network: net,
        redirectChain: ctx.redirectChain,
        consoleErrors: ctx.consoleErrors,
      },
    };
  },
};

export default plugin;
