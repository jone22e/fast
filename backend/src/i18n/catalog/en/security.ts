import type { PluginCatalog } from '../../types.js';

export const security: PluginCatalog = {
  name: 'Security',
  description: 'HTTPS, certificate, security headers, cookie policy and mixed content.',
  checks: {
    https: 'HTTPS enabled',
    'cert-valid': 'Trusted certificate',
    'cert-expiry': 'Certificate far from expiry',
    hsts: 'Strict-Transport-Security',
    csp: 'Content-Security-Policy',
    xfo: 'Clickjacking protection',
    xcto: 'X-Content-Type-Options: nosniff',
    referrer: 'Referrer-Policy',
    permissions: 'Permissions-Policy',
    'cookie-secure': 'Cookies with the Secure flag',
    'cookie-httponly': 'Cookies with HttpOnly',
    'cookie-samesite': 'Cookies with SameSite',
    'mixed-content': 'No mixed content',
    'version-disclosure': 'No server version disclosure',
  },
  issues: {
    'sec-no-https': {
      title: 'Site served without HTTPS',
      description:
        'All traffic travels in clear text and can be read and altered by any intermediary. Browsers flag the page as "Not secure" and search engines penalise the ranking.',
      fix: "Issue a certificate (Let's Encrypt is free), configure the server for HTTPS, and redirect all HTTP traffic to HTTPS with a 301.",
      gain: 'Data protection, no more "Not secure" warning, and ranking positions recovered.',
    },
    'sec-invalid-cert': {
      title: 'Invalid or untrusted TLS certificate',
      description:
        'The browser shows a full-screen security warning before allowing access, which makes most visitors leave.',
      fix: 'Check that the intermediate certificate chain is complete and that the certificate covers the hostname being accessed (including the www subdomain, if used).',
      gain: 'Access without security warnings.',
    },
    'sec-cert-expiring': {
      title: 'Certificate expires in {0} day(s)',
      description: 'Once it expires, every visitor gets a blocking security error.',
      fix: 'Renew the certificate and set up automatic renewal (certbot renew via a systemd timer or cron).',
      gain: 'Removes the risk of downtime from an expired certificate.',
    },
    'sec-no-hsts': {
      title: 'HSTS header missing',
      description:
        'Without HSTS, the first visit can be intercepted and downgraded to HTTP before the redirect happens.',
      fix: 'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains. Only enable includeSubDomains if every subdomain already uses HTTPS.',
      gain: 'The browser starts forcing HTTPS without waiting for the redirect.',
    },
    'sec-no-csp': {
      title: 'No Content-Security-Policy',
      description:
        'CSP is the primary defence against XSS: it declares which origins may load scripts, styles and images. Without it, any injected script runs freely.',
      fix: "Start with Content-Security-Policy-Report-Only to map the legitimate origins, then switch to blocking mode. A reasonable baseline: default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'.",
      gain: 'Mitigation of the most common class of web vulnerability.',
    },
    'sec-weak-csp': {
      title: 'Content-Security-Policy too permissive',
      description:
        'The policy contains unsafe-inline, unsafe-eval or wildcards, which cancels out much of the XSS protection.',
      fix: 'Replace unsafe-inline with per-script nonces or hashes, and remove unsafe-eval by refactoring code that uses eval() or new Function().',
      gain: 'A CSP that actually blocks script injection.',
    },
    'sec-no-xfo': {
      title: 'No clickjacking protection',
      description:
        'The page can be embedded in an iframe on a third-party site and covered with invisible elements to capture the user’s clicks.',
      fix: "Add X-Frame-Options: SAMEORIGIN, and preferably frame-ancestors 'self' in the CSP as well.",
      gain: 'Eliminates the clickjacking vector.',
    },
    'sec-missing-headers': {
      title: '{0} security headers missing',
      description:
        'Missing: {0}. These are low-cost protections against MIME sniffing, referrer leakage and misuse of browser APIs.',
      fix: 'Add on the server: X-Content-Type-Options: nosniff; Referrer-Policy: strict-origin-when-cross-origin; Permissions-Policy: geolocation=(), microphone=(), camera=().',
      gain: 'A smaller attack surface from a single configuration change.',
    },
    'sec-insecure-cookies': {
      title: '{0} cookie(s) without the Secure flag',
      description:
        'Cookies without Secure are also sent over HTTP connections, exposing sessions to interception.',
      fix: 'Set cookies with the Secure, HttpOnly and SameSite=Lax flags (or Strict when there is no legitimate cross-site navigation).',
      gain: 'Sessions protected from interception and script theft.',
    },
    'sec-mixed-content': {
      title: '{0} resource(s) loaded over HTTP on an HTTPS page',
      description:
        'Browsers block HTTP scripts and stylesheets inside HTTPS pages and mark the connection as partly insecure. Resources may simply fail to load.',
      fix: 'Swap every http:// URL for https:// (or protocol-relative paths). Add upgrade-insecure-requests to the CSP as a safety net.',
      gain: 'A fully secure connection with every resource loading correctly.',
    },
  },
};
