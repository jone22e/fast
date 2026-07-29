import type { PluginCatalog } from '../../types.js';

export const geo: PluginCatalog = {
  name: 'GEO — Generative Engine Optimization',
  description:
    'Optimization for AI engines: llms.txt, crawler permissions, semantic structure, authority and structured data.',
  checks: {
    'llms-exists': 'llms.txt available',
    'llms-encoding': 'llms.txt in UTF-8',
    'llms-size': 'llms.txt of a reasonable size',
    'llms-format': 'llms.txt in Markdown (not HTML)',
    'llms-h1': 'llms.txt with an H1 title',
    'llms-summary': 'llms.txt with a summary',
    'llms-sections': 'llms.txt with sections',
    'llms-links': 'llms.txt with internal links',
    'llms-full': 'llms-full.txt available',
    'ai-crawlers': 'AI crawlers allowed in',
    'ai-definitions': 'Clear definitions in the text',
    'ai-faq': 'Frequently asked questions section',
    'ai-lists': 'Use of lists',
    'ai-tables': 'Use of tables',
    'ai-steps': 'Step-by-step content',
    'ai-examples': 'Concrete examples',
    'ai-summary': 'Summary or conclusion',
    'authority-author': 'Authorship identified',
    'authority-published': 'Publication date',
    'authority-modified': 'Last updated date',
    'authority-refs': 'External references',
    'semantic-tags': 'HTML5 semantic tags',
    'schema-present': 'Structured data present',
    'schema-valid': 'JSON-LD without syntax errors',
    'schema-coverage': 'Coverage of relevant types',
  },
  issues: {
    'geo-no-llms-txt': {
      title: 'llms.txt file missing',
      description:
        'llms.txt is the emerging convention for telling language models about a site: what it is, which pages matter and how to read them. Without it, ChatGPT, Claude, Perplexity and Gemini have to guess the structure from the HTML.',
      fix: 'Create /llms.txt in Markdown: a "# Site name" at the top, a summary paragraph starting with "> ", and "## " sections grouping links to the most important pages, each with a one-line description.',
      gain: 'A better chance of being quoted correctly by AI engines, and fewer hallucinations about your product.',
    },
    'geo-llms-html': {
      title: 'llms.txt is returning HTML',
      description:
        'The server returns the error page or the SPA shell instead of the text file. Models fetching the file will get useless markup.',
      fix: 'Serve /llms.txt as a static file with Content-Type: text/plain; charset=utf-8, ahead of any catch-all application route.',
      gain: 'The file becomes genuinely consumable by AI models.',
    },
    'geo-llms-weak': {
      title: 'llms.txt with an incomplete structure',
      fix: 'Structure it as: "# Name", "> one-sentence summary", then "## Docs", "## Products" and so on, with links in the "- [Title](url): description" format.',
      gain: 'More accurate AI answers about what the site offers.',
    },
    'geo-blocked-ai-crawlers': {
      title: '{0} important AI crawler(s) blocked',
      description:
        'robots.txt denies access to: {0}. If the block is not intentional, the site is invisible to the generative engines that now answer a large share of informational searches.',
      fix: 'Review robots.txt. To allow them in, add one group per crawler: "User-agent: GPTBot" followed by "Allow: /". Careful: a "Disallow: /" under "User-agent: *" blocks every agent without its own rule.',
      gain: 'Presence in answers from ChatGPT, Claude, Perplexity, Copilot and Google AI Overviews.',
    },
    'geo-blocked-secondary-crawlers': {
      title: '{0} secondary AI crawler(s) blocked',
      description:
        'Blocked: {0}. Lower impact, but it reduces reach in models trained on those datasets.',
      fix: 'If the block is not intentional (a content-usage policy, for instance), allow these agents in robots.txt.',
      gain: 'Broader coverage across language models.',
    },
    'geo-no-faq': {
      title: 'No frequently asked questions section',
      description:
        'Question-and-answer blocks are the format AI models extract and quote most easily, because they already come shaped like the answer the user is looking for.',
      fix: 'Create a "Frequently asked questions" section with 5 to 10 crisp question/answer pairs, and mark it up with Schema.org FAQPage.',
      gain: 'A significant rise in the odds of being quoted directly by ChatGPT, Perplexity and AI Overviews.',
    },
    'geo-no-authority': {
      title: 'Authority signals missing: {0}',
      description:
        'AI models favour sources that state who wrote the content and when. Content without an author or a date is treated as less trustworthy and less quotable.',
      fix: 'Add <meta name="author">, <meta property="article:published_time"> and article:modified_time, plus a visible byline. Complement it with Schema.org Article containing author, datePublished and dateModified.',
      gain: 'More trust weight (E-E-A-T) and more citations in generated answers.',
    },
    'geo-no-main': {
      title: 'No <main> element',
      description:
        '<main> marks off the primary content and separates it from menus, footers and sidebars. Without it, content extractors (AI ones included) frequently capture navigation along with the text.',
      fix: 'Wrap the primary content in <main> (one per page) and move menus into <nav> and the footer into <footer>.',
      gain: 'Cleaner content extraction by AI and screen readers.',
    },
    'geo-weak-semantics': {
      title: 'Only {0} of {1} semantic tags in use',
      description:
        'The page relies mostly on <div>, which conveys no structural meaning to machines.',
      fix: 'Replace structural divs with header, nav, main, article, section, aside, figure/figcaption, footer and time.',
      gain: 'Better structural understanding by search engines and generative models.',
    },
    'geo-no-schema': {
      title: 'No structured data (Schema.org)',
      description:
        'Structured data in JSON-LD is the most direct way to state facts about the page unambiguously — who the organisation is, what the product is, what it costs, who wrote it. AI models and search engines treat it as a high-confidence source.',
      fix: 'Add a <script type="application/ld+json"> block with at least Organization (or LocalBusiness) and the page-specific type (Article, Product, Service, FAQPage). Validate it in Google’s Rich Results Test.',
      gain: 'Eligibility for rich results and more accurate AI answers about the brand.',
    },
    'geo-schema-invalid': {
      title: '{0} JSON-LD block(s) with syntax errors',
      description:
        'Malformed JSON is discarded silently — the markup effort produces no effect at all.',
      fix: 'Validate each JSON-LD block in a JSON validator and in Google’s Rich Results Test.',
      gain: 'The structured data actually gets read.',
    },
  },
};
