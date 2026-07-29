import type { PluginCatalog } from '../../types.js';

export const performance: PluginCatalog = {
  name: 'Performance',
  description: 'Core Web Vitals, resource weight, loading strategy and network efficiency.',
  checks: {
    lcp: 'Largest Contentful Paint',
    cls: 'Cumulative Layout Shift',
    inp: 'Interaction to Next Paint',
    fcp: 'First Contentful Paint',
    ttfb: 'Time To First Byte',
    si: 'Speed Index',
    tbt: 'Total Blocking Time',
    'total-weight': 'Total page weight',
    'img-weight': 'Image weight',
    'js-weight': 'JavaScript weight',
    'css-weight': 'CSS weight',
    'font-weight': 'Font weight',
    'media-weight': 'Video/media weight',
    requests: 'Number of requests',
    'img-sizing': 'Correctly sized images',
    'img-format': 'Modern image formats',
    lazy: 'Lazy loading on below-the-fold images',
    preload: 'Use of preload',
    preconnect: 'Use of preconnect/dns-prefetch',
    prefetch: 'Use of prefetch',
    'render-blocking': 'Render-blocking resources',
    compression: 'Text compression',
    brotli: 'Brotli enabled',
    cache: 'Static asset caching',
  },
  issues: {
    'perf-lcp': {
      title: 'LCP of {0} above the recommended threshold',
      description:
        'The largest visible element takes more than 2.5 s to appear. This is the metric Google weighs most heavily when judging perceived speed.',
      fix: 'Identify the LCP element (usually the hero image or the headline). Preload it, serve images as WebP/AVIF at the right dimensions, and remove render-blocking resources that come before it.',
      gain: 'Roughly {0} s cut from perceived load time.',
    },
    'perf-cls': {
      title: 'Unstable layout (CLS {0})',
      description:
        'Elements move around while the page loads, causing mis-clicks and a sense of instability.',
      fix: 'Declare width and height on every image and iframe, reserve space for banners and ads, and use font-display: optional or swap with a metrically compatible fallback.',
      gain: 'CLS under 0.1 and fewer accidental clicks.',
    },
    'perf-tbt': {
      title: 'JavaScript blocks the main thread for {0}',
      description:
        '{0} long tasks were detected. While they run, the page responds to neither clicks nor scrolling.',
      fix: 'Split the bundle with code splitting, defer non-critical scripts, move heavy processing to Web Workers, and drop unused libraries.',
      gain: 'Faster interactivity and INP within the good range.',
    },
    'perf-ttfb': {
      title: 'Server takes {0} to respond',
      description:
        'A high TTFB delays everything else — nothing can start before the first response arrives.',
      fix: 'Enable page caching on the server, use a CDN, optimise database queries, and check for unnecessary redirects before the response.',
      gain: 'Up to {0} s saved on every page.',
    },
    'perf-heavy-images': {
      title: '{0} image(s) over 300 KB',
      description:
        'The largest one is {0}. Heavy images are the most common cause of a high LCP, especially on mobile connections.',
      fix: 'Convert to WebP or AVIF, resize to the actual display size, and serve responsive variants with srcset.',
      gain: 'Estimated saving of {0} and about {1} s less on 4G.',
    },
    'perf-oversized-images': {
      title: '{0} image(s) much larger than the space they are displayed in',
      description:
        'The image is downloaded at high resolution and scaled down by the browser — the extra bytes are wasted.',
      fix: 'Generate versions at the real display dimensions and use srcset with sizes to serve the right variant to each screen.',
      gain: '40% to 70% less weight on the affected images.',
    },
    'perf-legacy-image-format': {
      title: '{0} images in JPEG/PNG/GIF',
      description:
        'WebP and AVIF deliver the same visual quality with 25% to 50% fewer bytes.',
      fix: 'Convert the images to WebP (or AVIF) and use the <picture> tag with a fallback for older browsers.',
      gain: 'Around 30% less total image weight on average.',
    },
    'perf-no-lazy': {
      title: 'Below-the-fold images without lazy loading',
      description:
        '{0} images outside the initial screen are downloaded immediately, competing with the visible content.',
      fix: 'Add loading="lazy" to images that do not appear on the first screen. Never apply it to the LCP image.',
      gain: 'Fewer bytes in the initial load and a faster LCP.',
    },
    'perf-render-blocking': {
      title: '{0} resources block rendering',
      description:
        '{0} stylesheets and {1} synchronous scripts in the <head> keep the page from appearing until they are downloaded and processed.',
      fix: 'Inline the critical above-the-fold CSS, load the rest with media="print" onload, and add defer or async to the scripts in the head.',
      gain: 'FCP and LCP typically 0.5 s to 1.5 s faster.',
    },
    'perf-no-compression': {
      title: '{0} text resources without compression',
      description:
        'HTML, CSS and JavaScript without Gzip/Brotli travel with 3 to 5 times more bytes than necessary.',
      fix: 'Enable Brotli (with a Gzip fallback) on the web server or the CDN. On nginx: `brotli on; gzip on;` for the text MIME types.',
      gain: 'Estimated saving of {0} per visit.',
    },
    'perf-weak-cache': {
      title: 'Static assets with short or missing cache',
      description:
        '{0} static files have no Cache-Control with a max-age of at least one day, forcing a fresh download on every visit.',
      fix: 'Set Cache-Control: public, max-age=31536000, immutable for versioned files (hashed names) and shorter values for HTML.',
      gain: 'Repeat visits become practically instant.',
    },
    'perf-bundle-size': {
      title: 'JavaScript bundle of {0}',
      description:
        'Large bundles have to be downloaded, parsed and executed before the page becomes interactive.',
      fix: 'Enable tree shaking, split code by route, load heavy components on demand, and audit dependencies with your bundler analyser.',
      gain: 'Typically 30% to 60% less initial JavaScript.',
    },
  },
};
