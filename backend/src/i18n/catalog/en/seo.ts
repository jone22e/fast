import type { PluginCatalog } from '../../types.js';

export const seo: PluginCatalog = {
  name: 'Traditional SEO',
  description: 'HTML tags, heading hierarchy, links, sitemap, robots.txt and social cards.',
  checks: {
    title: 'Title present and well sized',
    description: 'Meta description',
    canonical: 'Canonical URL declared',
    'robots-meta': 'Meta robots allows indexing',
    viewport: 'Meta viewport',
    charset: 'Charset declared',
    lang: 'lang attribute on <html>',
    h1: 'Single H1',
    'heading-order': 'Heading hierarchy without skips',
    'heading-empty': 'Headings with content',
    'internal-links': 'Internal links',
    'external-links': 'External links',
    'link-rel': 'External links with a safe rel',
    'broken-links': 'Links without errors',
    redirects: 'Links without redirects',
    'page-redirects': 'Page without a redirect chain',
    'robots-txt': 'robots.txt reachable',
    'robots-not-blocking': 'robots.txt does not block the whole site',
    'robots-sitemap': 'Sitemap declared in robots.txt',
    sitemap: 'sitemap.xml available',
    'sitemap-valid': 'Valid URLs in the sitemap',
    'open-graph': 'Complete Open Graph',
    twitter: 'Twitter Cards',
  },
  issues: {
    'seo-no-title': {
      title: 'Page without a <title> tag',
      description:
        'The title is the main relevance signal for search engines and the text shown in the results.',
      fix: 'Add a <title> in the <head> with 30 to 65 characters, containing the main keyword and the brand.',
      gain: 'Basic requirement for indexing and for click-through in search results.',
    },
    'seo-title-length': {
      title: 'Title with {0} characters',
      fix: 'Rewrite the title with 30 to 65 characters, leading with the most relevant term.',
      gain: 'Higher click-through rate in search results.',
    },
    'seo-no-description': {
      title: 'Meta description missing',
      description:
        'Without a description, the search engine assembles an automatic snippet from the content, usually less persuasive.',
      fix: 'Add <meta name="description" content="..."> with 70 to 165 characters summarising what the page offers.',
      gain: 'Typical 5% to 15% increase in click-through rate.',
    },
    'seo-no-canonical': {
      title: 'No canonical link',
      description:
        'Without a canonical, URL variations (with parameters, with or without a trailing slash) can be treated as duplicate pages.',
      fix: 'Add <link rel="canonical" href="preferred absolute URL"> to the <head> of every page.',
      gain: 'Authority consolidated into a single URL.',
    },
    'seo-noindex': {
      title: 'Page marked as noindex',
      description:
        'The meta robots tag tells search engines not to index this page. If that is not intentional, the page is invisible in search.',
      fix: 'Remove the noindex value from the meta robots tag, or confirm that the exclusion is intentional.',
      gain: 'Lets the page show up in search results.',
    },
    'seo-no-lang': {
      title: 'lang attribute missing on <html>',
      description:
        'Search engines and screen readers use lang to determine the language and the correct pronunciation of the content.',
      fix: 'Add lang="en" (or the correct language) to the <html> tag.',
      gain: 'Better language targeting and accessibility.',
    },
    'seo-no-h1': {
      title: 'Page without an H1',
      description:
        'The H1 defines the main topic of the page for search engines and screen readers.',
      fix: 'Add a single <h1> describing the main subject of the page.',
      gain: 'A clear topic signal for search engines and AI.',
    },
    'seo-multiple-h1': {
      title: '{0} H1 tags on the same page',
      description: 'Multiple H1s dilute the signal of what the main topic is.',
      fix: 'Keep a single H1 and turn the others into H2s.',
      gain: 'Clearer semantic hierarchy.',
    },
    'seo-heading-skip': {
      title: '{0} skip(s) in the heading hierarchy',
      description:
        'Skipping levels (H2 straight to H4, for example) breaks the logical structure of the document for screen readers and for AI models that extract the outline.',
      fix: 'Reorder the headings so they descend one level at a time. Use CSS for visual size, not the tag.',
      gain: 'A document structure machines can follow.',
    },
    'seo-unsafe-blank': {
      title: '{0} target="_blank" link(s) without rel="noopener"',
      description:
        'The destination page gains partial access to the originating window — a security and performance risk.',
      fix: 'Add rel="noopener noreferrer" to every link with target="_blank".',
      gain: 'Removes the tabnabbing risk.',
    },
    'seo-broken-links': {
      title: '{0} broken link(s)',
      description:
        'Out of a sample of {0} links, {1} returned an error or did not respond. Broken links hurt the experience and waste page authority.',
      fix: 'Fix or remove the listed links. For pages that moved, set up a permanent 301 redirect.',
      gain: 'Better crawling by search engines and fewer dead ends for visitors.',
    },
    'seo-redirect-chain': {
      title: 'Chain of {0} redirects',
      description:
        'Each hop adds a full network round trip before the content can start loading.',
      fix: 'Point the first redirect straight at the final URL, dropping the intermediate hops.',
      gain: '100 ms to 500 ms saved per visit.',
    },
    'seo-no-robots': {
      title: 'robots.txt missing or unreachable',
      description:
        'Without robots.txt, crawlers get no guidance on what to crawl or where the sitemap is.',
      fix: 'Create /robots.txt at the root with the crawl rules and a `Sitemap: https://yourdomain/sitemap.xml` line.',
      gain: 'More efficient crawling and automatic sitemap discovery.',
    },
    'seo-robots-blocks-all': {
      title: 'robots.txt blocks the entire site',
      description:
        'The `Disallow: /` rule for User-agent: * stops every search engine from crawling the site.',
      fix: 'Remove the Disallow: / rule or narrow it to the specific directories that really should not be crawled.',
      gain: 'Restores the site’s ability to appear in search.',
    },
    'seo-no-sitemap': {
      title: 'XML sitemap not found',
      description:
        'The sitemap speeds up the discovery of new pages and signals the site structure to search engines.',
      fix: 'Generate a sitemap.xml with every canonical URL, publish it at /sitemap.xml and declare it in robots.txt and in Search Console.',
      gain: 'Faster indexing of new content.',
    },
    'seo-sitemap-invalid': {
      title: '{0} invalid URL(s) in the sitemap',
      description: 'Malformed URLs in the sitemap are discarded by crawlers.',
      fix: 'Use only absolute, properly encoded URLs in the sitemap.',
      gain: 'Every listed page gets considered.',
    },
    'seo-og-incomplete': {
      title: 'Incomplete Open Graph ({0} tags missing)',
      description:
        'Without the Open Graph tags, sharing on social networks and messaging apps shows a generic card with no image.',
      gain: 'Attractive share cards and more clicks coming from social networks.',
    },
  },
};
