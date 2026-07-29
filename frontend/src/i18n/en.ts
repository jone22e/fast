import type { Messages } from './messages';

export const en: Messages = {
  langName: 'English',
  htmlLang: 'en',

  meta: {
    title: 'FAST — Complete website audit: performance, SEO, GEO and AI',
    description: 'Audit any site in seconds: performance, SEO, GEO for AI engines, accessibility and security, with a prioritised action plan. No sign-up.',
  },

  nav: {
    tagline: 'Complete web audit',
    cta: 'Analyse a site',
    language: 'Language',
    sections: [
      { id: 'modulos', label: 'What we analyse' },
      { id: 'como-funciona', label: 'How it works' },
      { id: 'diferencial', label: 'Comparison' },
      { id: 'glossario', label: 'Glossary' },
      { id: 'faq', label: 'FAQ' },
    ],
  },

  hero: {
    badge: 'Performance, SEO, security and GEO in a single analysis',
    titleLead: 'Find out what is holding your site back —',
    titleAccent: 'for AI engines too',
    lead: 'Enter the address and get a complete diagnosis in seconds: Core Web Vitals, technical SEO, accessibility, security, infrastructure and GEO — the optimization for ChatGPT, Claude, Gemini and Perplexity that PageSpeed does not cover.',
    urlLabel: 'Site address',
    placeholder: 'https://yoursite.com',
    analyze: 'Analyse',
    analyzing: 'Analysing…',
    tryLabel: 'Try:',
    scrollCue: 'See what FAST analyses',
    highlights: [
      { icon: 'layers', value: '10', label: 'audit modules' },
      { icon: 'check', value: '147', label: 'checks per analysis' },
      { icon: 'clock', value: '~50s', label: 'for the full report' },
      { icon: 'shield', value: '0', label: 'data stored' },
    ],
  },

  landing: {
    modules: {
      eyebrow: 'Coverage',
      title: 'Ten modules, 147 checks, one score per dimension',
      intro:
        'A FAST audit walks through ten quality dimensions and returns, for each one, a score from 0 to 100, the list of problems found, how severe each is, how to fix it and the expected gain. The analysis goes beyond speed: it also measures how the site is read by artificial intelligence engines and how exposed it is to attack — two things most tools ignore, yet which today decide visibility and uptime.',
      checksLabel: 'checks',
      items: [
        {
          name: 'Performance',
          checks: 24,
          desc: 'Core Web Vitals (LCP, CLS, INP, FCP, TTFB), image, JavaScript and font weight, render-blocking resources, compression and caching.',
        },
        {
          name: 'Technical SEO',
          checks: 23,
          desc: 'Title, meta description, canonical, heading hierarchy, broken and redirected links, sitemap.xml, robots.txt and social cards.',
        },
        {
          name: 'GEO',
          checks: 18,
          desc: 'llms.txt, AI crawler permissions, semantic structure, authority signals and Schema.org structured data.',
        },
        {
          name: 'Content',
          checks: 10,
          desc: 'Clarity, depth, readability, redundancy, scannability and thin-content signals.',
        },
        {
          name: 'Accessibility',
          checks: 11,
          desc: 'Colour contrast, alternative text, form labels, keyboard navigation and semantic landmarks.',
        },
        {
          name: 'Security',
          checks: 14,
          desc: 'HTTPS, certificate validity and chain, HSTS, Content-Security-Policy, cookies and mixed content.',
        },
        {
          name: 'Protection & Exposure',
          checks: 11,
          desc: 'WAF, origin IP exposure, keys and passwords in the served code, stack traces, database errors and disclosure policy.',
        },
        {
          name: 'Infrastructure',
          checks: 15,
          desc: 'HTTP/2 and HTTP/3, Brotli and Gzip compression, caching policy, CDN, DNS resolution, IPv6 and the redirect chain.',
        },
        {
          name: 'Mobile',
          checks: 8,
          desc: 'Viewport, layout breaks, font size, tap targets, responsive images and visual stability on the phone.',
        },
        {
          name: 'UX',
          checks: 13,
          desc: 'Navigation, visual hierarchy, typographic consistency, clarity of the calls to action, forms and time to interactivity.',
        },
      ],
    },

    steps: {
      eyebrow: 'How it works',
      title: 'From URL to action plan in four steps',
      intro:
        'The whole process is automatic and takes less than a minute. You watch each module finish, in real time, while the analysis runs.',
      figure:
        'The path of an audit: a single collection feeds all ten modules, and the consolidated report is interpreted by AI before it reaches you.',
      flow: ['URL', 'Collection in a real browser', '10 modules in parallel', 'Scores and problems', 'AI action plan'],
      items: [
        {
          title: 'You enter the URL',
          desc: 'No sign-up, nothing to install and no changes to your code — the analysis is external, done the way a visitor (or a search bot) sees the page.',
        },
        {
          title: 'The page is really opened',
          desc: 'A real Chromium browser loads the site on desktop and on mobile and collects, in a single pass, performance, network, DOM, DNS and TLS metrics.',
        },
        {
          title: 'Ten modules analyse in parallel',
          desc: 'Each module applies its checks to the same collection and returns a score from 0 to 100, the problems found and the evidence for each one.',
        },
        {
          title: 'AI builds the action plan',
          desc: 'A language model reads the whole report and writes the executive summary, the priority order and the step-by-step fix in plain language.',
        },
      ],
    },

    comparison: {
      eyebrow: 'Comparison',
      title: 'What FAST sees and performance tools do not',
      intro:
        'Performance tools answer “is the site fast?”. FAST also answers “is the site found, understood by AI and protected?”.',
      caption: 'Comparison between FAST and traditional performance tools',
      colFeature: 'Check',
      colFast: 'FAST',
      colOthers: 'Performance tools',
      yes: 'yes',
      no: 'no',
      partial: 'partial',
      rows: [
        { feature: 'Core Web Vitals and performance', pagespeed: true },
        { feature: 'Technical SEO (headings, canonical, sitemap, broken links)', pagespeed: 'partial' },
        { feature: 'GEO — llms.txt and AI crawlers', pagespeed: false },
        { feature: 'Security headers, TLS and cookies', pagespeed: false },
        { feature: 'Exposure: WAF, origin IP, keys in the code', pagespeed: false },
        { feature: 'Accessibility and UX', pagespeed: 'partial' },
        { feature: 'AI-prioritised action plan', pagespeed: false },
        { feature: 'Export to PDF and to JSON for AI', pagespeed: false },
      ],
    },

    glossary: {
      eyebrow: 'Definitions',
      title: 'The terms that show up in the report',
      intro:
        'Every problem FAST reports is explained in the report itself. This glossary collects the concepts that come up most often.',
      terms: [
        {
          term: 'GEO (Generative Engine Optimization)',
          def: 'GEO is the optimization of a site for generative engines — ChatGPT, Claude, Gemini, Perplexity and Copilot. Where SEO competes for a position in the list of results, GEO competes to be the source quoted inside the ready-made answer the user reads.',
        },
        {
          term: 'llms.txt',
          def: 'llms.txt is a Markdown file published at the root of the domain that introduces the site to language models: what it is, which pages matter and how to read them. It works for AI the way robots.txt works for search engines — FAST’s own, for example, lives at /llms.txt.',
        },
        {
          term: 'Core Web Vitals',
          def: 'Core Web Vitals are the three metrics Google uses to measure the real loading experience: LCP (when the largest element appears), CLS (how much the layout jumps) and INP (how quickly the page responds to an interaction).',
        },
        {
          term: 'CSP (Content-Security-Policy)',
          def: 'CSP is an HTTP header that declares which origins a page may load scripts, styles and images from. It is the primary defence against XSS: an injected script that does not come from a declared origin simply does not run.',
        },
        {
          term: 'HSTS',
          def: 'HSTS stands for HTTP Strict Transport Security. It is the header that tells the browser to talk to the domain over HTTPS only, without waiting for the redirect — which closes the interception window on the very first visit.',
        },
        {
          term: 'Schema.org',
          def: 'Schema.org is the structured-data vocabulary that describes the meaning of content in JSON-LD. It is what lets a search engine understand that a passage is a frequently asked question, a product or an organisation, and not just text.',
        },
      ],
    },

    faq: {
      eyebrow: 'Frequently asked questions',
      title: 'Common questions about the audit',
      items: [
        {
          q: 'Does FAST replace Google PageSpeed?',
          a: 'FAST covers performance the way PageSpeed does and goes further: it assesses technical SEO, GEO (optimization for AI), accessibility, security, attack exposure and UX, explaining every problem with its priority, estimated time and expected gain.',
        },
        {
          q: 'Does FAST store audit results?',
          a: 'No. There is no sign-up and no database. The report exists only while it runs and is discarded at the end — reload the page and it is gone. That is why PDF and JSON export sit right at the top of the report.',
        },
        {
          q: 'What is the GEO module?',
          a: 'GEO is optimization for AI engines such as ChatGPT, Claude, Gemini and Perplexity. FAST validates llms.txt, AI crawler permissions, structured data and authority signals.',
        },
        {
          q: 'Does FAST run penetration tests?',
          a: 'No. The security and protection assessment is strictly passive: it looks only at what the site already returns when visited, sending no attack payload at all. It is safe to point at a production site.',
        },
        {
          q: 'How long does an audit take?',
          a: 'Between 30 and 60 seconds on most sites. Loading the page in a real browser is the slowest step; the ten modules run in parallel over the same collection, and the AI interpretation happens at the end.',
        },
        {
          q: 'Do I need to install anything or touch the site code?',
          a: 'No. The analysis is external and sees the site as any visitor would: the public URL is enough. No script, tag or permission has to be added to the site being analysed.',
        },
        {
          q: 'Can I analyse a staging site or one behind a password?',
          a: 'Only if the URL is publicly reachable. Environments protected by login, VPN or an IP allowlist are out of reach, because the collection starts from the outside, with no credentials.',
        },
        {
          q: 'How do I use the report inside an AI?',
          a: 'Export it as JSON: the file already comes with an instruction header and a glossary of the fields. Paste it into an AI chat and ask for the details of each fix — the nginx configuration snippet for the missing headers, for instance.',
        },
      ],
    },

    summary: {
      eyebrow: 'In short',
      title: 'The essentials in five lines',
      cta: 'Analyse a site now',
      points: [
        'FAST audits any public site in under a minute, with no sign-up and nothing to install.',
        '147 checks across ten modules, from Core Web Vitals to infrastructure exposure.',
        'Every problem comes with its severity, estimated fix time and expected gain.',
        'An AI reads the report and hands you the action plan already prioritised.',
        'Nothing is stored: the report lives on your screen and you take it away as PDF or JSON.',
      ],
    },

    refs: {
      eyebrow: 'References',
      title: 'Standards FAST applies',
      intro: 'The checks follow public specifications — go to the source of each one:',
      items: [
        { label: 'Core Web Vitals — web.dev', url: 'https://web.dev/articles/vitals' },
        { label: 'The llms.txt specification', url: 'https://llmstxt.org/' },
        { label: 'Schema.org vocabulary', url: 'https://schema.org/' },
        { label: 'WCAG 2.2 — W3C', url: 'https://www.w3.org/WAI/WCAG22/quickref/' },
        { label: 'Content-Security-Policy — MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP' },
        { label: 'RFC 9116 — security.txt', url: 'https://www.rfc-editor.org/info/rfc9116/' },
        { label: 'Sitemaps protocol', url: 'https://www.sitemaps.org/protocol.html' },
      ],
    },
  },

  progress: {
    title: 'Audit in progress',
    starting: 'Starting…',
    done: 'finished',
    failed: 'failed',
    running: 'analysing…',
    queued: 'queued',
  },

  report: {
    back: '← Analyse another site',
    aiButton: 'AI analysis',
    overall: 'Overall score',
    analyzedAt: 'Analysed on',
    runtime: 'of runtime',
    stats: {
      issues: 'problems',
      critical: 'critical',
      high: 'high',
      aiScore: 'AI Score',
      fixTime: 'to fix',
    },
    exportPdf: 'Export PDF',
    exportingPdf: 'Generating PDF…',
    exportJson: 'Export JSON',
    pdfError: 'The PDF could not be generated. Please try again.',
    noIssues: 'No problems',
    issuesCount: 'problem(s)',
    issuesTitle: 'Problems found',
    filterCategory: 'Filter by category',
    filterSeverity: 'Filter by severity',
    allCategories: 'All categories',
    allSeverities: 'All severities',
    emptyFiltered: 'No problems match the selected filters.',
    modulesTitle: 'Module breakdown',
    modulesIntro: 'Every check that ran, with the value measured in each one.',
    checklistTitle: 'Fix checklist',
    checklistProgress: 'done — progress is local and is not saved on any server.',
    moduleFailed: 'Module failed:',
    recommendations: 'Recommendations',
    checksCaption: 'Checks of module',
  },

  issue: {
    howToFix: 'How to fix',
    expectedGain: 'Expected gain',
    impact: 'Impact',
    difficulty: 'Difficulty',
    estimatedTime: 'Estimated time',
    evidence: 'Evidence',
  },

  plan: { title: 'Action plan', steps: 'steps' },

  jsonExport: {
    format: 'FAST web audit report',
    instructions:
      'This is the complete report of an automated audit of the site below. ' +
      'Each module has a score from 0 to 100, checks with the measured value, and issues ' +
      'with severity, impact, difficulty, estimated fix time, how to fix it (howToFix), ' +
      'expected gain (expectedGain) and evidence. The "ai" field holds a plain-language ' +
      'analysis. Use this data to explain the problems, prioritise them and detail the fixes. ' +
      'Do not invent metrics that are not here.',
    glossary: {
      overallScore: 'Overall score from 0 to 100.',
      categories: 'Score, weight and number of problems per category.',
      plugins: 'Each audit module: checks, issues and evidence (raw measurements).',
      issues: 'Consolidated list of problems, ordered by priority.',
      ai: 'AI interpretation: summary, priorities, impacts, gains and action plan.',
      checklist: 'Fix items derived from the problems.',
      summary: 'Problem counts by severity and total estimated time.',
    },
  },

  ai: {
    badge: 'AI analysis',
    open: 'Open analysis',
    title: 'AI analysis',
    subtitle: 'Interpretation of the technical report',
    close: 'Close',
    executive: 'Executive summary',
    mainProblems: 'Main problems',
    priorities: 'Priority order',
    impacts: 'Business impact',
    gains: 'Estimated gains',
    notes: 'Technical notes',
    foot: 'Generated by AI from the audit data. The detailed action plan is on the page.',
    unavailable: 'AI analysis unavailable.',
    unavailableHint:
      'The technical audit completed normally — only the plain-language interpretation was not generated.',
  },

  labels: {
    severity: {
      critical: 'Critical',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      info: 'Informational',
    },
    priority: {
      alta: 'High priority',
      media: 'Medium priority',
      baixa: 'Low priority',
    },
    impact: { alto: 'High', medio: 'Medium', baixo: 'Low' },
    difficulty: { facil: 'Easy', media: 'Medium', dificil: 'Hard' },
    score: {
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Needs work',
      poor: 'Critical',
    },
    minutes: 'min',
    hours: 'h',
    workdays: 'workday(s)',
  },

  errors: {
    auditFailed: 'The audit could not be completed',
    retry: 'Try again',
    connectionLost: 'The connection to the server was interrupted. Please try again.',
  },

  footer: {
    blurb:
      'Audits run on demand, with no authentication and no persistence. No result is stored once the analysis ends.',
    by: 'By',
    updated: 'updated on',
  },
};
