import type { PluginCatalog } from '../../types.js';

export const geo: PluginCatalog = {
  name: 'GEO — 生成式引擎优化',
  description: '面向 AI 引擎的优化：llms.txt、抓取工具权限、语义结构、权威信号与结构化数据。',
  checks: {
    'llms-exists': 'llms.txt 可用',
    'llms-encoding': 'llms.txt 使用 UTF-8',
    'llms-size': 'llms.txt 体积合理',
    'llms-format': 'llms.txt 为 Markdown（而非 HTML）',
    'llms-h1': 'llms.txt 含 H1 标题',
    'llms-summary': 'llms.txt 含摘要',
    'llms-sections': 'llms.txt 含分节',
    'llms-links': 'llms.txt 含站内链接',
    'llms-full': 'llms-full.txt 可用',
    'ai-crawlers': 'AI 抓取工具获得放行',
    'ai-definitions': '正文中有清晰的定义',
    'ai-faq': '常见问题板块',
    'ai-lists': '列表的使用',
    'ai-tables': '表格的使用',
    'ai-steps': '分步骤的内容',
    'ai-examples': '具体示例',
    'ai-summary': '摘要或结论',
    'authority-author': '已标明作者',
    'authority-published': '发布日期',
    'authority-modified': '更新日期',
    'authority-refs': '外部引用',
    'semantic-tags': 'HTML5 语义标签',
    'schema-present': '存在结构化数据',
    'schema-valid': 'JSON-LD 无语法错误',
    'schema-coverage': '相关类型的覆盖度',
  },
  issues: {
    'geo-no-llms-txt': {
      title: '缺少 llms.txt 文件',
      description:
        'llms.txt 是正在形成的约定，用于告诉语言模型这个网站是什么、哪些页面重要、应如何理解。没有它，ChatGPT、Claude、Perplexity 和 Gemini 只能从 HTML 猜测网站结构。',
      fix: '用 Markdown 创建 /llms.txt：顶部写“# 网站名称”，接一段以“> ”开头的摘要，再用“## ”分节列出最重要页面的链接，每条附一句描述。',
      gain: '被 AI 引擎正确引用的概率更高，关于你产品的臆测更少。',
    },
    'geo-llms-html': {
      title: 'llms.txt 返回的是 HTML',
      description:
        '服务器返回的是错误页或单页应用外壳，而不是纯文本文件。前来抓取该文件的模型只会拿到无用的标记。',
      fix: '把 /llms.txt 作为静态文件提供，Content-Type 设为 text/plain; charset=utf-8，并排在应用的兜底路由之前。',
      gain: '该文件真正可被 AI 模型使用。',
    },
    'geo-llms-weak': {
      title: 'llms.txt 结构不完整',
      fix: '按此结构编写：“# 名称”、“> 一句话摘要”，随后是“## 文档”“## 产品”等分节，链接采用“- [标题](网址)：描述”的格式。',
      gain: 'AI 对网站提供内容的回答更准确。',
    },
    'geo-blocked-ai-crawlers': {
      title: '{0} 个重要的 AI 抓取工具被封禁',
      description:
        'robots.txt 阻止了以下抓取工具的访问：{0}。若封禁并非有意，网站将在如今承担大量信息型搜索的生成式引擎中隐身。',
      fix: '检查 robots.txt。要放行，请为每个抓取工具添加一组规则：“User-agent: GPTBot”后接“Allow: /”。注意：“User-agent: *”下的“Disallow: /”会封禁所有没有专属规则的抓取工具。',
      gain: '出现在 ChatGPT、Claude、Perplexity、Copilot 以及 Google AI 概览的回答中。',
    },
    'geo-blocked-secondary-crawlers': {
      title: '{0} 个次要的 AI 抓取工具被封禁',
      description: '被封禁的有：{0}。影响较小，但会削弱在以这些语料训练的模型中的覆盖面。',
      fix: '若封禁并非有意（例如出于内容使用政策），请在 robots.txt 中放行这些代理。',
      gain: '在各类语言模型中的覆盖更广。',
    },
    'geo-no-faq': {
      title: '缺少常见问题板块',
      description:
        '问答块是 AI 模型最容易提取和引用的格式，因为它本身就已经是用户所寻找答案的形态。',
      fix: '创建“常见问题”板块，写 5 到 10 组简明的问答，并用 Schema.org FAQPage 标注。',
      gain: '被 ChatGPT、Perplexity 与 AI 概览直接引用的概率显著提升。',
    },
    'geo-no-authority': {
      title: '缺少权威信号：{0}',
      description:
        'AI 模型更青睐标明作者与时间的来源。没有署名与日期的内容会被视为可信度更低、更不值得引用。',
      fix: '添加 <meta name="author">、<meta property="article:published_time"> 与 article:modified_time，并在页面上显示署名。再配合 Schema.org Article，填写 author、datePublished 与 dateModified。',
      gain: '可信度权重（E-E-A-T）更高，在生成式回答中被引用得更多。',
    },
    'geo-no-main': {
      title: '缺少 <main> 元素',
      description:
        '<main> 用于界定主内容，把它与菜单、页脚和侧边栏分开。没有它，内容提取器（包括 AI 的）常把导航连同正文一起抓走。',
      fix: '用 <main> 包裹主内容（每页一个），把菜单移入 <nav>，把页脚移入 <footer>。',
      gain: 'AI 与屏幕阅读器提取的内容更干净。',
    },
    'geo-weak-semantics': {
      title: '语义标签仅使用了 {1} 个中的 {0} 个',
      description: '页面主要依赖 <div>，无法向机器传达任何结构含义。',
      fix: '把结构性的 div 替换为 header、nav、main、article、section、aside、figure/figcaption、footer 与 time。',
      gain: '搜索引擎与生成式模型更能理解页面结构。',
    },
    'geo-no-schema': {
      title: '没有结构化数据（Schema.org）',
      description:
        'JSON-LD 结构化数据是最直接、无歧义地声明页面事实的方式——组织是谁、产品是什么、价格多少、由谁撰写。AI 模型与搜索引擎会把它当作高可信度的来源。',
      fix: '添加 <script type="application/ld+json"> 块，至少包含 Organization（或 LocalBusiness）以及页面对应的具体类型（Article、Product、Service、FAQPage），并用 Google 的富媒体搜索结果测试工具验证。',
      gain: '具备展示富媒体结果的资格，AI 对品牌的回答也更准确。',
    },
    'geo-schema-invalid': {
      title: '{0} 个 JSON-LD 块存在语法错误',
      description: '格式错误的 JSON 会被静默丢弃——标注工作完全不产生效果。',
      fix: '用 JSON 校验工具和 Google 的富媒体搜索结果测试工具逐块验证 JSON-LD。',
      gain: '结构化数据真正被读取。',
    },
  },
};
