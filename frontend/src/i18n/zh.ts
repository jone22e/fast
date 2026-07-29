import type { Messages } from './messages';

export const zh: Messages = {
  langName: '简体中文',
  htmlLang: 'zh-CN',

  meta: {
    title: 'FAST — 全面网站审计：性能、SEO、GEO 与 AI',
    description: '几秒内审计任意网站：性能、SEO、面向 AI 的 GEO、无障碍与安全，并给出已排序的行动计划。无需注册。',
  },

  nav: {
    tagline: '全面的网站审计',
    cta: '分析网站',
    language: '语言',
    sections: [
      { id: 'modulos', label: '分析范围' },
      { id: 'como-funciona', label: '运作方式' },
      { id: 'diferencial', label: '功能对比' },
      { id: 'glossario', label: '术语表' },
      { id: 'faq', label: '常见问题' },
    ],
  },

  hero: {
    badge: '性能、SEO、安全与 GEO，一次分析全覆盖',
    titleLead: '找出拖慢你网站的问题——',
    titleAccent: '也包括面向 AI 的问题',
    lead: '输入网址，几秒内获得完整诊断：Core Web Vitals、技术 SEO、无障碍、安全、基础设施，以及 GEO——面向 ChatGPT、Claude、Gemini 与 Perplexity 的优化，这是 PageSpeed 不覆盖的部分。',
    urlLabel: '网站地址',
    placeholder: 'https://yoursite.com',
    analyze: '开始分析',
    analyzing: '分析中……',
    tryLabel: '试试：',
    scrollCue: '看看 FAST 分析什么',
    highlights: [
      { icon: 'layers', value: '10', label: '个审计模块' },
      { icon: 'check', value: '147', label: '项检查' },
      { icon: 'clock', value: '~50秒', label: '生成完整报告' },
      { icon: 'shield', value: '0', label: '数据留存' },
    ],
  },

  landing: {
    modules: {
      eyebrow: '覆盖范围',
      title: '十个模块、147 项检查，每个维度一个评分',
      intro:
        'FAST 的一次审计会走遍十个质量维度，为每个维度给出 0 到 100 的评分、发现的问题清单、各问题的严重程度、修复方法与预期收益。分析不止于速度：它同时衡量网站被人工智能引擎读取的效果，以及暴露在攻击面前的程度——这两点大多数工具都忽略，但今天它们决定着可见度与可用性。',
      checksLabel: '项检查',
      items: [
        {
          name: '性能',
          checks: 24,
          desc: 'Core Web Vitals（LCP、CLS、INP、FCP、TTFB）、图片与 JavaScript 及字体体积、阻塞渲染的资源、压缩与缓存。',
        },
        {
          name: '技术 SEO',
          checks: 23,
          desc: 'title、meta description、canonical、标题层级、失效与跳转链接、sitemap.xml、robots.txt 与社交卡片。',
        },
        {
          name: 'GEO',
          checks: 18,
          desc: 'llms.txt、AI 抓取工具权限、语义结构、权威信号与 Schema.org 结构化数据。',
        },
        {
          name: '内容',
          checks: 10,
          desc: '清晰度、深度、可读性、冗余度、可扫读性以及内容单薄的迹象。',
        },
        {
          name: '无障碍',
          checks: 11,
          desc: '色彩对比、替代文本、表单标签、键盘导航与语义地标。',
        },
        {
          name: '安全',
          checks: 14,
          desc: 'HTTPS、证书有效期与证书链、HSTS、Content-Security-Policy、Cookie 与混合内容。',
        },
        {
          name: '防护与暴露面',
          checks: 11,
          desc: 'WAF、源站 IP 暴露、对外代码中的密钥与口令、堆栈信息、数据库错误与漏洞披露政策。',
        },
        {
          name: '基础设施',
          checks: 15,
          desc: 'HTTP/2 与 HTTP/3、Brotli 与 Gzip 压缩、缓存策略、CDN、DNS 解析、IPv6 与跳转链。',
        },
        {
          name: '移动端',
          checks: 8,
          desc: 'viewport、布局错位、字号、点击目标、响应式图片与手机端的视觉稳定性。',
        },
        {
          name: '用户体验',
          checks: 13,
          desc: '导航、视觉层级、排版一致性、行动号召的清晰度、表单以及可交互所需时间。',
        },
      ],
    },

    steps: {
      eyebrow: '运作方式',
      title: '四步走完从网址到行动计划',
      intro: '整个流程全自动，用时不到一分钟。分析进行时，你可以实时看到每个模块依次完成。',
      figure: '一次审计的路径：一次采集喂给十个模块，汇总后的报告先经 AI 解读，再呈现给你。',
      flow: ['网址', '真实浏览器采集', '10 个模块并行', '评分与问题', 'AI 行动计划'],
      items: [
        {
          title: '你输入网址',
          desc: '无需注册、无需安装、无需改动网站代码——分析在外部进行，与访客（或搜索引擎爬虫）看到页面的方式完全一致。',
        },
        {
          title: '页面被真实打开',
          desc: '真实的 Chromium 浏览器在桌面与手机两种形态下加载网站，一次性采集性能、网络、DOM、DNS 与 TLS 指标。',
        },
        {
          title: '十个模块并行分析',
          desc: '每个模块对同一份采集数据执行各自的检查，返回 0 到 100 的评分、发现的问题以及每项问题的证据。',
        },
        {
          title: 'AI 生成行动计划',
          desc: '语言模型通读整份报告，用平实的语言写出执行摘要、优先级顺序和逐步修复方案。',
        },
      ],
    },

    comparison: {
      eyebrow: '功能对比',
      title: 'FAST 能看到、而性能工具看不到的东西',
      intro:
        '性能工具回答“网站快不快？”。FAST 还回答“网站能被找到吗、AI 看得懂吗、防护到位吗？”。',
      caption: 'FAST 与传统性能工具的对比',
      colFeature: '检查项',
      colFast: 'FAST',
      colOthers: '性能工具',
      yes: '支持',
      no: '不支持',
      partial: '部分支持',
      rows: [
        { feature: 'Core Web Vitals 与性能', pagespeed: true },
        { feature: '技术 SEO（标题层级、canonical、站点地图、失效链接）', pagespeed: 'partial' },
        { feature: 'GEO——llms.txt 与 AI 抓取工具', pagespeed: false },
        { feature: '安全响应头、TLS 与 Cookie', pagespeed: false },
        { feature: '暴露面：WAF、源站 IP、代码中的密钥', pagespeed: false },
        { feature: '无障碍与用户体验', pagespeed: 'partial' },
        { feature: '由 AI 排定优先级的行动计划', pagespeed: false },
        { feature: '导出 PDF 与供 AI 使用的 JSON', pagespeed: false },
      ],
    },

    glossary: {
      eyebrow: '术语定义',
      title: '报告中会出现的术语',
      intro: 'FAST 指出的每个问题在报告里都有解释。这份术语表收录了出现最频繁的概念。',
      terms: [
        {
          term: 'GEO（生成式引擎优化）',
          def: 'GEO 是针对生成式引擎——ChatGPT、Claude、Gemini、Perplexity 与 Copilot——对网站所做的优化。SEO 争的是结果列表中的位置，GEO 争的是成为用户直接读到的那段答案所引用的来源。',
        },
        {
          term: 'llms.txt',
          def: 'llms.txt 是发布在域名根目录的 Markdown 文件，用来向语言模型介绍这个网站：它是什么、哪些页面重要、应该如何理解。它之于 AI，正如 robots.txt 之于搜索引擎——例如 FAST 自己的文件就在 /llms.txt。',
        },
        {
          term: 'Core Web Vitals',
          def: 'Core Web Vitals 是 Google 用来衡量真实加载体验的三项指标：LCP（最大元素何时出现）、CLS（布局跳动的幅度）与 INP（对交互的响应时间）。',
        },
        {
          term: 'CSP（Content-Security-Policy）',
          def: 'CSP 是一个 HTTP 响应头，用于声明页面可以从哪些来源加载脚本、样式和图片。它是防御 XSS 的首要手段：来源未被声明的注入脚本根本不会执行。',
        },
        {
          term: 'HSTS',
          def: 'HSTS 即 HTTP Strict Transport Security。这个响应头告诉浏览器只能通过 HTTPS 与该域名通信，无需等待跳转，从而关闭了首次访问时被劫持的窗口。',
        },
        {
          term: 'Schema.org',
          def: 'Schema.org 指的是用 JSON-LD 描述内容含义的结构化数据词汇表。正是它让搜索引擎明白某段内容是常见问题、是产品还是组织信息，而不只是普通文字。',
        },
      ],
    },

    faq: {
      eyebrow: '常见问题',
      title: '关于审计的常见疑问',
      items: [
        {
          q: 'FAST 能取代 Google PageSpeed 吗？',
          a: 'FAST 覆盖 PageSpeed 所做的性能评估，并且更进一步：它还评估技术 SEO、GEO（面向 AI 的优化）、无障碍、安全、攻击暴露面与用户体验，并为每个问题标注优先级、预计耗时与预期收益。',
        },
        {
          q: 'FAST 会保存审计结果吗？',
          a: '不会。没有注册，也没有数据库。报告只在运行期间存在，结束即丢弃——刷新页面就没了。所以 PDF 与 JSON 导出按钮就放在报告顶部。',
        },
        {
          q: 'GEO 模块是什么？',
          a: 'GEO 是面向 ChatGPT、Claude、Gemini、Perplexity 等 AI 引擎的优化。FAST 会校验 llms.txt、AI 抓取工具权限、结构化数据与权威信号。',
        },
        {
          q: 'FAST 会做渗透测试吗？',
          a: '不会。安全与防护评估是严格被动的：只分析网站在被访问时本就返回的内容，不发送任何攻击载荷。对生产环境的站点使用是安全的。',
        },
        {
          q: '一次审计需要多久？',
          a: '多数网站在 30 到 60 秒之间。用真实浏览器加载页面是最慢的一步；十个模块基于同一份采集并行运行，AI 解读则在最后进行。',
        },
        {
          q: '需要安装什么或改动网站代码吗？',
          a: '不需要。分析在外部进行，看到的和普通访客一样，只要公开可访问的网址即可。被分析的网站不必添加任何脚本、标签或权限。',
        },
        {
          q: '可以分析预发布环境或需要密码的站点吗？',
          a: '只有网址公开可访问才行。受登录、VPN 或 IP 白名单保护的环境无法被触达，因为采集从外部发起，且不带任何凭据。',
        },
        {
          q: '怎样把报告用在 AI 里？',
          a: '导出为 JSON：文件自带一段说明和字段术语表。把它粘贴进 AI 对话，再让它细化修复步骤——例如为缺失的响应头生成对应的 nginx 配置片段。',
        },
      ],
    },

    summary: {
      eyebrow: '要点回顾',
      title: '五句话讲清楚',
      cta: '立即分析一个网站',
      points: [
        'FAST 可在一分钟内审计任意公开网站，无需注册，也无需安装任何东西。',
        '共有 147 项检查，分布在十个模块中，从 Core Web Vitals 到基础设施暴露面。',
        '每个问题都附带严重程度、预计修复时间与预期收益。',
        'AI 通读报告，直接给出已排好优先级的行动计划。',
        '不留存任何数据：报告只在你的屏幕上，可导出为 PDF 或 JSON 带走。',
      ],
    },

    refs: {
      eyebrow: '参考资料',
      title: 'FAST 依据的标准',
      intro: '各项检查均遵循公开规范，可查阅其出处：',
      items: [
        { label: 'Core Web Vitals — web.dev', url: 'https://web.dev/articles/vitals' },
        { label: 'llms.txt 规范', url: 'https://llmstxt.org/' },
        { label: 'Schema.org 词汇表', url: 'https://schema.org/' },
        { label: 'WCAG 2.2 — W3C', url: 'https://www.w3.org/WAI/WCAG22/quickref/' },
        { label: 'Content-Security-Policy — MDN', url: 'https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/CSP' },
        { label: 'RFC 9116 — security.txt', url: 'https://www.rfc-editor.org/info/rfc9116/' },
        { label: '站点地图协议', url: 'https://www.sitemaps.org/protocol.html' },
      ],
    },
  },

  progress: {
    title: '审计进行中',
    starting: '正在启动……',
    done: '已完成',
    failed: '失败',
    running: '分析中……',
    queued: '排队中',
  },

  report: {
    back: '← 分析其他网站',
    aiButton: 'AI 分析',
    overall: '总评分',
    analyzedAt: '分析于',
    runtime: '运行耗时',
    stats: {
      issues: '个问题',
      critical: '个严重',
      high: '个高危',
      aiScore: 'AI 得分',
      fixTime: '修复用时',
    },
    exportPdf: '导出 PDF',
    exportingPdf: '正在生成 PDF……',
    exportJson: '导出 JSON',
    pdfError: 'PDF 生成失败，请重试。',
    noIssues: '没有问题',
    issuesCount: '个问题',
    issuesTitle: '发现的问题',
    filterCategory: '按类别筛选',
    filterSeverity: '按严重程度筛选',
    allCategories: '全部类别',
    allSeverities: '全部严重程度',
    emptyFiltered: '没有符合所选筛选条件的问题。',
    modulesTitle: '各模块明细',
    modulesIntro: '已执行的全部检查，以及每一项的实测值。',
    checklistTitle: '修复清单',
    checklistProgress: '已完成——进度仅保存在本地，不会上传到服务器。',
    moduleFailed: '模块执行失败：',
    recommendations: '建议',
    checksCaption: '模块的检查项：',
  },

  issue: {
    howToFix: '如何修复',
    expectedGain: '预期收益',
    impact: '影响',
    difficulty: '难度',
    estimatedTime: '预计耗时',
    evidence: '证据',
  },

  plan: { title: '行动计划', steps: '个步骤' },

  jsonExport: {
    format: 'FAST 网站审计报告',
    instructions:
      '这是对下述网站进行自动化审计后的完整报告。' +
      '每个模块都有 0 到 100 的评分、带实测值的检查项（checks），以及问题（issues）——' +
      '包含严重程度、影响、难度、预计修复时间、修复方法（howToFix）、预期收益（expectedGain）与证据。' +
      '"ai" 字段是自然语言分析。请依据这些数据解释问题、排定优先级并细化修复步骤。' +
      '不要编造此处没有的指标。',
    glossary: {
      overallScore: '0 到 100 的总评分。',
      categories: '各类别的评分、权重与问题数量。',
      plugins: '每个审计模块：checks（检查项）、issues（问题）与 evidence（原始证据）。',
      issues: '按优先级排序的问题汇总列表。',
      ai: 'AI 解读：摘要、优先级、影响、收益与行动计划。',
      checklist: '由问题衍生出的修复清单项。',
      summary: '按严重程度统计的问题数量与预计总耗时。',
    },
  },

  ai: {
    badge: 'AI 分析',
    open: '查看分析',
    title: 'AI 分析',
    subtitle: '对技术报告的解读',
    close: '关闭',
    executive: '执行摘要',
    mainProblems: '主要问题',
    priorities: '优先级顺序',
    impacts: '对业务的影响',
    gains: '预期收益',
    notes: '技术备注',
    foot: '由 AI 根据审计数据生成。详细的行动计划在页面中。',
    unavailable: 'AI 分析不可用。',
    unavailableHint: '技术审计已正常完成——只是没有生成自然语言解读。',
  },

  labels: {
    severity: {
      critical: '严重',
      high: '高',
      medium: '中',
      low: '低',
      info: '提示',
    },
    priority: {
      alta: '高优先级',
      media: '中优先级',
      baixa: '低优先级',
    },
    impact: { alto: '高', medio: '中', baixo: '低' },
    difficulty: { facil: '容易', media: '中等', dificil: '困难' },
    score: {
      excellent: '优秀',
      good: '良好',
      fair: '有待改进',
      poor: '严重',
    },
    minutes: '分钟',
    hours: '小时',
    workdays: '个工作日',
  },

  errors: {
    auditFailed: '审计未能完成',
    retry: '重试',
    connectionLost: '与服务器的连接已中断，请重试。',
  },

  footer: {
    blurb: '审计按需执行，无需登录，也不做任何持久化。分析结束后不保存任何结果。',
    by: '由',
    updated: '更新于',
  },
};
