import type { PluginCatalog } from '../../types.js';

export const protection: PluginCatalog = {
  name: '防护与暴露面',
  description:
    '对安全态势的被动评估：WAF/防火墙、源站外网 IP 的暴露、对外提供的代码中泄露的密钥与口令、SQL 注入风险、口令传输方式与漏洞披露政策。',
  checks: {
    waf: 'WAF / 应用防火墙',
    'origin-protected': '源站 IP 隐藏在 CDN/代理之后',
    'no-internal-ip-leak': '未泄露内网 IP',
    'version-disclosure': '未泄露版本/技术栈',
    'sql-error-leak': '未泄露数据库错误',
    'no-stacktrace': '未暴露堆栈信息',
    'param-surface': '参数暴露面可控',
    'no-exposed-files': '无可访问的敏感文件',
    'no-exposed-secrets': '对外代码中无密钥/机密',
    'password-transport': '口令传输安全',
    'security-txt': 'security.txt（漏洞披露政策）',
    'no-autoindex': '已禁用目录列表',
  },
  issues: {
    'prot-no-waf': {
      gain: '在请求抵达服务器之前，自动拦截绝大多数已知攻击（OWASP Top 10）。',
    },
    'prot-origin-exposed': {
      title: '源站外网 IP 已暴露（{0}）',
      description:
        '地址 {0} 直接响应该主机，且不属于任何已知 CDN 网络——也就是说，这就是源站服务器本身，可从公网直达。前方没有边缘节点（Cloudflare、CloudFront、Fastly）时，攻击者会直接瞄准这个 IP：流量型拒绝服务（DDoS）、端口扫描，以及绕过一切依赖 DNS 的防护。仅用 Route53 解决不了——它只是 DNS，仍会公开真实 IP；必须有一个代理来代替源站接收流量。',
      fix: '分步操作：(1) 在前方部署可隐藏源站的反向代理——Cloudflare（开启橙色云代理）或 CloudFront/Fastly；(2) 修改 DNS 记录，指向代理而不再指向服务器 IP；(3) 重新配置主机防火墙（ufw/iptables/安全组），仅允许 CDN 的 IP 段访问 80 与 443 端口，其余一律拒绝——这样即便有人拿到旧 IP 也无法触达源站；(4) 如条件允许，迁移后更换服务器的公网 IP，使早已泄露该地址的历史记录失效。',
      gain: '源站 IP 不再可被直接访问；流量型攻击在边缘被吸收，不会打垮服务器。',
    },
    'prot-internal-ip-leak': {
      title: '内网 IP 地址已暴露',
      description:
        '响应头或 HTML 中出现了内网地址。这会暴露基础设施拓扑（代理、负载均衡、应用服务器），方便攻击者摸清环境。',
      fix: '在反向代理配置中移除会暴露内网 IP 的响应头（X-Backend-Server、X-Real-IP、Via），并从注释和错误页中删除内网 IP。',
      gain: '攻击者能获得的内部拓扑信息更少。',
    },
    'prot-tech-disclosure': {
      title: '服务器泄露版本与技术栈',
      description:
        '响应头与元数据暴露了所用技术栈及版本。攻击者正是据此挑选影响该特定版本的已知漏洞利用——这是任何自动化扫描的第一步。',
      fix: '隐藏版本号：nginx 使用 `server_tokens off;`；Apache 使用 `ServerTokens Prod` 与 `ServerSignature Off`；在应用中移除 X-Powered-By 响应头（Express 中为 `app.disable("x-powered-by")`）；并删除带版本号的 generator 元标签。',
      gain: '按版本发起的自动化攻击失去目标，暴露面变得不透明。',
    },
    'prot-sql-error-leak': {
      title: '数据库错误已暴露（{0}）',
      description:
        '页面直接显示了数据库的原始错误信息。这是存在 SQL 注入风险的强烈信号：它不仅泄露了表结构与查询语句，还表明用户输入未经处理就进入数据库，且异常没有被捕获。这正是攻击者用来确认并利用注入的回显。',
      fix: '两方面着手：(1) 始终使用参数化查询/预编译语句——绝不把用户输入拼接进 SQL；(2) 捕获数据库异常并展示通用错误页，详细信息只写入服务器日志。生产环境请关闭错误显示（例如 PHP 中的 `display_errors = Off`）。',
      gain: '堵住数据外泄的主要通道，不再把数据库结构拱手交给攻击者。',
    },
    'prot-stacktrace': {
      title: '应用堆栈信息已暴露',
      description:
        '页面暴露了调用堆栈，其中包含文件路径、内部函数名、依赖库与版本——这些都是攻击者构造利用链的宝贵信息，也说明错误处理被关闭或配置有误。',
      fix: '在生产环境关闭详细错误输出，配置通用的 500 错误页，详细信息只写入服务器日志。',
      gain: '消除应用内部细节的泄露。',
    },
    'prot-exposed-file': {
      title: '敏感文件可被公开访问：{0}',
      description:
        '一个或多个本不应公开的文件正通过网络直接对外响应。.env、.git、数据库转储或配置备份等文件会交出凭据、API 密钥、连接字符串——就 .git 而言，还包括站点的完整源代码。任何访客或机器人只要请求该 URL 就能拿到内容；这是自动化扫描最常盯上的暴露之一。',
      fix: '分步操作：(1) 在服务器上封禁这些路径——nginx 中 `location ~ /\\.(?!well-known) { deny all; }` 可覆盖 .env、.git 等隐藏文件；再加规则拒绝 *.sql、*.bak、*.old 与 *.save；(2) 把转储和备份移出公开目录（绝不应放在 docroot 中）；(3) 若某个 .env、密钥或凭据已被对外提供，请视为已泄露：吊销并签发新凭据；(4) 若 .git 已暴露，整个历史都可能被克隆——凡是经过该仓库的机密都应轮换。',
      gain: '切断对凭据、源代码与数据的直接访问——影响最大、也最易被利用的暴露。',
    },
    'prot-exposed-secret': {
      title: '代码中暴露了机密：{0}',
      description:
        '交付给浏览器的 HTML 或脚本中出现了一个或多个密钥/令牌。任何访客——以及任何机器人——只要查看页面源码就能读到。泄露的密钥可被用来非法访问它所认证的服务（云平台、支付网关、代码仓库），往往还会直接产生费用。',
      fix: '分步操作：(1) 立即在服务商处吊销该密钥——它已被公开提供，必须视为已泄露；(2) 生成新密钥并只保存在服务器上（环境变量），绝不放进前端代码；(3) 把使用该密钥的调用移到后端，只向浏览器暴露自有接口；(4) 若确实必须下发到客户端（例如 Google Maps），请在服务商控制台按域名/HTTP referer 及 API 范围加以限制。',
      gain: '堵住对该密钥所认证服务的非法访问，消除被恶意使用而产生费用的风险。',
    },
    'prot-hardcoded-password': {
      title: '代码中可能存在硬编码的口令/机密（{0}）',
      description:
        '在对外提供的 HTML/JS 中发现了形似口令或机密的赋值。其中可能有误报（示例值），但每一处都值得人工复核——前端代码中的凭据对任何访客都是可见的。',
      fix: '逐条复核。若确为真实凭据，请立即吊销并迁移到服务器端。切勿把口令提交进代码库；请使用环境变量与密钥保管服务。',
      gain: '消除交付给浏览器的代码中可读的凭据。',
    },
    'prot-password-http': {
      title: '密码字段所在页面未启用 HTTPS',
      description:
        '页面含有密码字段，却未通过 HTTPS 提供。用户输入的口令以明文传输，网络中的任何中间环节（公共 Wi-Fi、运营商、代理）都能读取。这是凭据的直接泄露。',
      fix: '改用 HTTPS 提供该页面，并把所有 HTTP 重定向到 HTTPS。免费证书（Let’s Encrypt）即可解决。切勿在 HTTP 页面上收集口令。',
      gain: '凭据不再以明文传输。',
    },
    'prot-password-get': {
      title: '密码表单通过 GET 提交',
      description:
        '含密码字段的表单使用了 method="get"。口令会出现在 URL 中——被记入浏览器历史、服务器与代理日志，以及发送给第三方的 Referer 头。这是凭据泄露。',
      fix: '把表单方法改为 POST。口令与敏感数据绝不可放入查询字符串。',
      gain: '口令不再从 URL、日志和 Referer 头中泄露。',
    },
    'prot-password-action-http': {
      title: '密码表单提交到 HTTP 地址',
      description:
        '页面本身是 HTTPS，但登录表单把数据发送到 http:// 地址——提交环节的保护被抵消，口令以明文传输到目标。',
      fix: '把表单的 action 指向 https:// 地址。同时检查目标端是否存在会降级到 HTTP 的跳转。',
      gain: '凭据在到达服务器的全程都受保护。',
    },
    'prot-no-security-txt': {
      title: '没有 security.txt（漏洞披露渠道）',
      description:
        '站点没有 /.well-known/security.txt。缺少明确渠道时，发现漏洞的人不知道该如何告知——本可以低调修复的问题，最终演变成公开事件，甚至被转卖。',
      fix: '创建 /.well-known/security.txt（RFC 9116），至少包含一行 "Contact: mailto:security@你的域名" 和一行带未来日期的 "Expires:"。也可加上指向披露政策的 "Policy:"。',
      gain: '安全研究者有了负责任地上报漏洞的途径。',
    },
    'prot-autoindex': {
      title: '已启用目录列表',
      description:
        '服务器会列出没有索引页的目录内容。这会暴露本不该被浏览的文件——备份、配置、上传文件——等于把服务器的文件地图交给攻击者。',
      fix: '关闭自动列目录（nginx 中为 `autoindex off;`，本就是默认值；Apache 中删除 `Options +Indexes`）。',
      gain: '没有明确链接的文件不再可被浏览。',
    },
  },
};
