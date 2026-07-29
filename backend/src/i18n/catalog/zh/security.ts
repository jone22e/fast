import type { PluginCatalog } from '../../types.js';

export const security: PluginCatalog = {
  name: '安全',
  description: 'HTTPS、证书、安全响应头、Cookie 策略与混合内容。',
  checks: {
    https: '已启用 HTTPS',
    'cert-valid': '证书受信任',
    'cert-expiry': '证书距到期尚远',
    hsts: 'Strict-Transport-Security',
    csp: 'Content-Security-Policy',
    xfo: '点击劫持防护',
    xcto: 'X-Content-Type-Options: nosniff',
    referrer: 'Referrer-Policy',
    permissions: 'Permissions-Policy',
    'cookie-secure': 'Cookie 带 Secure 标记',
    'cookie-httponly': 'Cookie 带 HttpOnly',
    'cookie-samesite': 'Cookie 带 SameSite',
    'mixed-content': '无混合内容',
    'version-disclosure': '未泄露服务器版本',
  },
  issues: {
    'sec-no-https': {
      title: '站点未启用 HTTPS',
      description:
        '所有流量以明文传输，任何中间环节都可读取和篡改。浏览器会将页面标记为“不安全”，搜索引擎也会下调排名。',
      fix: '申请证书（Let’s Encrypt 免费），将服务器配置为 HTTPS，并用 301 把所有 HTTP 流量重定向到 HTTPS。',
      gain: '数据得到保护，去掉“不安全”提示，并挽回排名。',
    },
    'sec-invalid-cert': {
      title: 'TLS 证书无效或不受信任',
      description: '浏览器会在放行前显示整屏安全警告，多数访客会因此离开。',
      fix: '检查中间证书链是否完整，以及证书是否覆盖所访问的域名（若使用 www 子域，也需覆盖）。',
      gain: '访问时不再出现安全警告。',
    },
    'sec-cert-expiring': {
      title: '证书将在 {0} 天后到期',
      description: '一旦过期，所有访客都会遇到拦截式的安全错误。',
      fix: '续期证书，并配置自动续期（通过 systemd 定时器或 cron 执行 certbot renew）。',
      gain: '消除因证书过期导致服务不可用的风险。',
    },
    'sec-no-hsts': {
      title: '缺少 HSTS 响应头',
      description: '没有 HSTS，首次访问可能在跳转发生前就被劫持并降级为 HTTP。',
      fix: '添加：Strict-Transport-Security: max-age=31536000; includeSubDomains。仅当所有子域都已使用 HTTPS 时才启用 includeSubDomains。',
      gain: '浏览器直接强制 HTTPS，无需等待跳转。',
    },
    'sec-no-csp': {
      title: '没有 Content-Security-Policy',
      description:
        'CSP 是防御 XSS 的首要手段：它声明脚本、样式与图片可以从哪些来源加载。没有它，任何被注入的脚本都能自由执行。',
      fix: "先用 Content-Security-Policy-Report-Only 摸清合法来源，再切换到拦截模式。一个合理的基线：default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'。",
      gain: '缓解最常见的一类 Web 漏洞。',
    },
    'sec-weak-csp': {
      title: 'Content-Security-Policy 过于宽松',
      description: '策略中包含 unsafe-inline、unsafe-eval 或通配符，使 XSS 防护大打折扣。',
      fix: '用逐脚本的 nonce 或哈希替代 unsafe-inline，并重构使用 eval() 或 new Function() 的代码以去掉 unsafe-eval。',
      gain: '让 CSP 真正拦截脚本注入。',
    },
    'sec-no-xfo': {
      title: '没有点击劫持防护',
      description: '页面可被第三方站点嵌入 iframe，并覆盖不可见元素来窃取用户的点击。',
      fix: "添加 X-Frame-Options: SAMEORIGIN，并最好同时在 CSP 中设置 frame-ancestors 'self'。",
      gain: '消除点击劫持的攻击途径。',
    },
    'sec-missing-headers': {
      title: '缺少 {0} 个安全响应头',
      description:
        '缺少：{0}。这些都是成本极低的防护，用于抵御 MIME 嗅探、Referrer 泄露和浏览器 API 的滥用。',
      fix: '在服务器上添加：X-Content-Type-Options: nosniff；Referrer-Policy: strict-origin-when-cross-origin；Permissions-Policy: geolocation=(), microphone=(), camera=()。',
      gain: '一次配置改动即可缩小攻击面。',
    },
    'sec-insecure-cookies': {
      title: '{0} 个 Cookie 缺少 Secure 标记',
      description: '未设置 Secure 的 Cookie 也会随 HTTP 连接发送，使会话面临被截获的风险。',
      fix: '为 Cookie 设置 Secure、HttpOnly 与 SameSite=Lax（若不存在合法的跨站跳转，可用 Strict）。',
      gain: '会话免于被截获和被脚本窃取。',
    },
    'sec-mixed-content': {
      title: 'HTTPS 页面中有 {0} 个资源通过 HTTP 加载',
      description:
        '浏览器会拦截 HTTPS 页面内的 HTTP 脚本与样式表，并把连接标记为部分不安全，相关资源可能直接加载失败。',
      fix: '把所有 http:// 网址改为 https://（或使用协议相对路径），并在 CSP 中加入 upgrade-insecure-requests 作为兜底。',
      gain: '连接全程安全，所有资源都能正常加载。',
    },
  },
};
