import type { PluginCatalog } from '../../types.js';

export const infrastructure: PluginCatalog = {
  name: '基础设施',
  description: 'HTTP 协议、压缩、缓存、CDN、DNS、IPv6 与跳转链。',
  checks: {
    http2: '支持 HTTP/2',
    http3: '支持 HTTP/3（QUIC）',
    'compression-html': 'HTML 已压缩',
    brotli: '已启用 Brotli',
    'cache-control': '文档带 Cache-Control',
    validators: 'ETag 或 Last-Modified',
    'keep-alive': '持久连接',
    cdn: '通过 CDN 分发',
    dns: 'DNS 解析正常',
    ipv6: '支持 IPv6',
    'dns-redundancy': '地址冗余',
    redirects: '没有过长的跳转链',
    status: 'HTTP 200 响应',
    'server-response': '服务器响应时间',
    console: '控制台无 JavaScript 错误',
  },
  issues: {
    'infra-no-http2': {
      title: '服务器疑似仍在使用 HTTP/1.1',
      description:
        'HTTP/1.1 限制单连接的并发请求数，且没有多路复用与头部压缩，会拖慢资源众多的页面。',
      fix: '在 Web 服务器上启用 HTTP/2（nginx：`listen 443 ssl; http2 on;`），或在前方接入 CDN——多数 CDN 已默认提供 HTTP/2 与 HTTP/3。',
      gain: '并行加载效率更高，资源文件多的页面尤其受益。',
    },
    'infra-no-compression': {
      title: 'HTML 未经压缩',
      description: '主文档既未使用 Gzip 也未使用 Brotli，体积通常是必要值的 3 到 4 倍。',
      fix: '在服务器上启用压缩。nginx：`gzip on; gzip_types text/html text/css application/javascript application/json image/svg+xml;`，若有 brotli 模块也一并开启。',
      gain: '文本文件体积减少 60% 到 80%。',
    },
    'infra-no-cache-control': {
      title: 'HTML 文档没有 Cache-Control',
      description: '缺少明确指令时，每个浏览器和代理都会套用自己的缓存推断，行为变得难以预测。',
      fix: '显式设置 Cache-Control。动态 HTML：`no-cache` 搭配 ETag；静态 HTML：`public, max-age=300, must-revalidate`。',
      gain: '缓存行为可预期，再验证更高效。',
    },
    'infra-no-cdn': {
      title: '未检测到 CDN',
      description:
        '没有分发网络时，所有访客都直接从源站取文件——地理位置较远的用户要承担完整的往返延迟。',
      fix: '在站点前方接入 CDN（Cloudflare、Fastly、CloudFront、Bunny）。除了分发，多数还会自动提供 HTTP/3、Brotli 与边缘缓存。',
      gain: '远离源站的访客 TTFB 大幅降低。',
    },
    'infra-no-ipv6': {
      title: '域名没有 AAAA（IPv6）记录',
      description:
        '越来越多的移动网络是纯 IPv6，只能依赖 NAT64 转换访问 IPv4 服务器，这会额外增加延迟。',
      fix: '添加指向服务器 IPv6 地址的 AAAA 记录，或在 CDN 上启用 IPv6。',
      gain: 'IPv6 网络中的用户可直连。',
    },
    'infra-temp-redirect': {
      title: '{0} 处临时跳转（302/307）',
      description:
        '永久性跳转应使用 301 或 308——使用 302 时，搜索引擎会继续收录旧网址，也不会传递权重。',
      fix: '把确定不会变的跳转改为 301（或 308，它会保留 HTTP 方法）。',
      gain: '权重正确传递到最终网址。',
    },
    'infra-bad-status': {
      title: '页面返回 HTTP {0}',
      description: '该网址没有返回 200 OK——搜索引擎不会收录内容，用户也可能看到错误页。',
      fix: '检查服务器与应用配置，使该网址返回 200 并输出预期内容。',
      gain: '页面可访问、可被收录。',
    },
    'infra-console-errors': {
      title: '加载过程中出现 {0} 个 JavaScript 错误',
      description: '控制台报错意味着功能已经损坏——表单、埋点、交互组件都可能失效。',
      fix: '打开开发者工具，复现列出的错误，并逐一修复根因。',
      gain: '功能恢复正常，行为不再难以预料。',
    },
  },
};
