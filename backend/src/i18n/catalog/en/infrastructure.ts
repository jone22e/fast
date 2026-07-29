import type { PluginCatalog } from '../../types.js';

export const infrastructure: PluginCatalog = {
  name: 'Infrastructure',
  description: 'HTTP protocol, compression, caching, CDN, DNS, IPv6 and the redirect chain.',
  checks: {
    http2: 'HTTP/2 available',
    http3: 'HTTP/3 (QUIC) available',
    'compression-html': 'HTML compressed',
    brotli: 'Brotli enabled',
    'cache-control': 'Cache-Control on the document',
    validators: 'ETag or Last-Modified',
    'keep-alive': 'Persistent connections',
    cdn: 'Delivered through a CDN',
    dns: 'DNS resolving',
    ipv6: 'IPv6 support',
    'dns-redundancy': 'Address redundancy',
    redirects: 'No long redirect chain',
    status: 'HTTP 200 response',
    'server-response': 'Server response time',
    console: 'No JavaScript errors in the console',
  },
  issues: {
    'infra-no-http2': {
      title: 'Server apparently on HTTP/1.1',
      description:
        'HTTP/1.1 limits parallel requests per connection and has neither multiplexing nor header compression, slowing down pages with many resources.',
      fix: 'Enable HTTP/2 on the web server (nginx: `listen 443 ssl; http2 on;`) or put a CDN in front, which already serves HTTP/2 and HTTP/3.',
      gain: 'More efficient parallel loading, especially on pages with many files.',
    },
    'infra-no-compression': {
      title: 'HTML served without compression',
      description:
        'The main document travels without Gzip or Brotli, typically 3 to 4 times larger than necessary.',
      fix: 'Enable compression on the server. On nginx: `gzip on; gzip_types text/html text/css application/javascript application/json image/svg+xml;` and, if available, the brotli module.',
      gain: '60% to 80% less weight on text files.',
    },
    'infra-no-cache-control': {
      title: 'HTML document without Cache-Control',
      description:
        'With no explicit directive, every browser and proxy applies its own caching heuristic — the behaviour becomes unpredictable.',
      fix: 'Set Cache-Control explicitly. For dynamic HTML: `no-cache` with an ETag. For static HTML: `public, max-age=300, must-revalidate`.',
      gain: 'Predictable caching behaviour and efficient revalidation.',
    },
    'infra-no-cdn': {
      title: 'No CDN detected',
      description:
        'Without a delivery network, every visitor fetches the files from the origin server — geographically distant users pay the full latency.',
      fix: 'Put a CDN in front of the site (Cloudflare, Fastly, CloudFront, Bunny). Beyond distribution, most of them deliver HTTP/3, Brotli and edge caching automatically.',
      gain: 'Substantially lower TTFB for visitors far from the origin server.',
    },
    'infra-no-ipv6': {
      title: 'Domain without an AAAA (IPv6) record',
      description:
        'A growing share of mobile networks is IPv6-only and depends on NAT64 translation to reach IPv4 servers, which adds latency.',
      fix: 'Add an AAAA record pointing to the server’s IPv6 address, or enable IPv6 on the CDN.',
      gain: 'A direct connection for users on IPv6 networks.',
    },
    'infra-temp-redirect': {
      title: '{0} temporary redirect(s) (302/307)',
      description:
        'Permanent redirects should use 301 or 308 — with a 302, search engines keep the old URL indexed and do not transfer authority.',
      fix: 'Switch the redirects that are definitive to 301 (or 308, which preserves the HTTP method).',
      gain: 'Authority correctly transferred to the final URL.',
    },
    'infra-bad-status': {
      title: 'Page responded with HTTP {0}',
      description:
        'The URL does not return 200 OK — search engines will not index the content and users may see an error page.',
      fix: 'Check the server and application configuration so the URL answers 200 with the expected content.',
      gain: 'A reachable, indexable page.',
    },
    'infra-console-errors': {
      title: '{0} JavaScript error(s) during load',
      description:
        'Console errors point to broken functionality — forms, tracking and interactive components may not be working.',
      fix: 'Open DevTools, reproduce the listed errors and fix the source of each one.',
      gain: 'Restored functionality and less unpredictable behaviour.',
    },
  },
};
