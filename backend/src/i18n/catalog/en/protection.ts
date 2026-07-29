import type { PluginCatalog } from '../../types.js';

export const protection: PluginCatalog = {
  name: 'Protection & Exposure',
  description:
    'Passive assessment of the security posture: WAF/firewall, exposure of the external origin IP, keys and passwords leaked in the served code, SQL injection susceptibility, password transport and disclosure policy.',
  checks: {
    waf: 'WAF / application firewall',
    'origin-protected': 'Origin IP hidden behind a CDN/proxy',
    'no-internal-ip-leak': 'No internal IP leakage',
    'version-disclosure': 'No version/technology disclosure',
    'sql-error-leak': 'No database errors leaking',
    'no-stacktrace': 'No stack traces exposed',
    'param-surface': 'Controlled parameter surface',
    'no-exposed-secrets': 'No keys/secrets in the served code',
    'password-transport': 'Secure password transport',
    'security-txt': 'security.txt (disclosure policy)',
    'no-autoindex': 'Directory listing disabled',
  },
  issues: {
    'prot-no-waf': {
      gain: 'Automatic blocking of most known attacks (OWASP Top 10) before they reach the server.',
    },
    'prot-origin-exposed': {
      title: 'External origin IP exposed ({0})',
      description:
        'The addresses {0} answer for this host and belong to no known CDN network — meaning it is the origin server itself, reachable directly from the internet. With no edge (Cloudflare, CloudFront, Fastly) in front, an attacker aims straight at the IP: volumetric denial of service (DDoS), port scanning, and attacks that bypass any protection that relied on DNS. Route53 alone does not solve this — it is only DNS and still publishes the real IP; you need a proxy that receives the traffic in place of the origin.',
      fix: 'Step by step: (1) put a reverse proxy in front that hides the origin — Cloudflare (orange-cloud proxy enabled) or CloudFront/Fastly; (2) change the DNS record to point at the proxy rather than at the server IP; (3) reconfigure the machine firewall (ufw/iptables/Security Group) to accept ports 80 and 443 ONLY from the CDN IP ranges and refuse the rest — so even someone who learns the old IP cannot reach the origin; (4) if possible, change the server’s public IP after the migration, to invalidate historical records that already leaked the address.',
      gain: 'The origin IP stops being directly reachable; volumetric attacks are absorbed at the edge instead of taking the server down.',
    },
    'prot-internal-ip-leak': {
      title: 'Internal IP address exposed',
      description:
        'An internal network address appears in response headers or in the HTML. That reveals the infrastructure topology (proxies, load balancers, application servers) and makes it easier for an attacker to map the environment.',
      fix: 'Remove headers that expose internal IPs (X-Backend-Server, X-Real-IP, Via) in the reverse proxy configuration, and strip internal IPs from comments and error pages.',
      gain: 'Less information about the internal topology available to an attacker.',
    },
    'prot-tech-disclosure': {
      title: 'Server discloses version and technology',
      description:
        'Headers and metadata reveal the stack and the versions in use. An attacker uses exactly that information to pick known exploits affecting that specific version — it is the first step of any automated scan.',
      fix: 'Hide the versions: on nginx use `server_tokens off;`; on Apache `ServerTokens Prod` and `ServerSignature Off`; drop the X-Powered-By header in the application (on Express, `app.disable("x-powered-by")`); and remove the generator meta tag with the version.',
      gain: 'Version-targeted automated attacks lose their target; the surface goes opaque.',
    },
    'prot-sql-error-leak': {
      title: 'Database errors exposed ({0})',
      description:
        'The page shows raw database error messages. That is a strong sign of SQL injection susceptibility: beyond revealing the structure of tables and queries, it indicates that user input reaches the database unsanitised and that errors are not being caught. It is exactly the response an attacker looks for to confirm and exploit an injection.',
      fix: 'Two fronts: (1) always use parameterised queries / prepared statements — never concatenate user input into SQL; (2) catch database exceptions and show a generic error page, logging the detail only on the server. In production, turn off error display (for example `display_errors = Off` in PHP).',
      gain: 'Closes the main data exfiltration vector and stops handing the attacker a map of the database.',
    },
    'prot-stacktrace': {
      title: 'Application stack trace exposed',
      description:
        'The page reveals a stack trace. It exposes file paths, internal function names, libraries and versions — valuable information for an attacker building an exploit, and a sign that error handling is off or misconfigured.',
      fix: 'Disable detailed error output in production and configure a generic 500 error page. Log the detail only on the server.',
      gain: 'Eliminates the leak of internal application details.',
    },
    'prot-exposed-secret': {
      title: 'Secret exposed in the code: {0}',
      description:
        'One or more keys/tokens appear in the HTML or in the scripts delivered to the browser. Any visitor — and any bot — can read them by opening the page source. A leaked key allows improper access to the services it authenticates (cloud, payment gateway, repository), often with a direct financial cost.',
      fix: 'Step by step: (1) REVOKE the key immediately with the provider — treat it as compromised, since it has already been served publicly; (2) generate a new one and keep it on the server only (environment variable), never in frontend code; (3) move the call that uses the key to the backend, exposing only your own endpoint to the browser; (4) if it is a key that genuinely has to reach the client (Google Maps, for instance), restrict it by domain/HTTP referrer and by API in the provider’s dashboard.',
      gain: 'Closes improper access to the services the key authenticates and removes the risk of cost from malicious use.',
    },
    'prot-hardcoded-password': {
      title: 'Possible hardcoded password/secret in the code ({0})',
      description:
        'Assignments that look like a password or secret were found embedded in the served HTML/JS. There may be false positives (sample values), but every occurrence deserves a manual review — credentials in frontend code are visible to any visitor.',
      fix: 'Review each occurrence. If it is a real credential, revoke it and move it to the server. Never commit passwords in code; use environment variables and a secret vault.',
      gain: 'Removes credentials readable in the code delivered to the browser.',
    },
    'prot-password-http': {
      title: 'Password field on a page without HTTPS',
      description:
        'The page has a password field but is not served over HTTPS. The typed password travels in clear text and can be read by any intermediary on the network (public Wi-Fi, ISP, proxy). It is a direct credential leak.',
      fix: "Serve the page over HTTPS and redirect all HTTP to HTTPS. A free certificate (Let's Encrypt) is enough. Never collect a password on an HTTP page.",
      gain: 'Credentials stop travelling in clear text.',
    },
    'prot-password-get': {
      title: 'Password form submitting via GET',
      description:
        'A form with a password field uses method="get". The password ends up in the URL — recorded in the browser history, in the server and proxy logs, and in the Referer header sent to third parties. It is a credential leak.',
      fix: 'Change the form method to POST. Passwords and sensitive data must never go in the query string.',
      gain: 'The password stops leaking into URLs, logs and Referer headers.',
    },
    'prot-password-action-http': {
      title: 'Password form submits to an HTTP destination',
      description:
        'The page is HTTPS, but the login form sends the data to an http:// URL — the protection is cancelled on submission, and the password travels in clear text to the destination.',
      fix: 'Point the form action at an https:// URL. Also check for redirects at the destination that might downgrade to HTTP.',
      gain: 'Credentials protected the whole way to the server.',
    },
    'prot-no-security-txt': {
      title: 'No security.txt (vulnerability disclosure channel)',
      description:
        'There is no /.well-known/security.txt. Without a clear channel, whoever finds a flaw in your site has no idea how to tell you — and a vulnerability that could have been fixed quietly ends up as a public incident, or gets sold.',
      fix: 'Create /.well-known/security.txt (RFC 9116) with at least: a "Contact: mailto:security@yourdomain.com" line and an "Expires:" line with a future date. Optionally add "Policy:" pointing at your disclosure policy.',
      gain: 'Researchers get a path to report flaws responsibly.',
    },
    'prot-autoindex': {
      title: 'Directory listing enabled',
      description:
        'The server shows the contents of directories that have no index page. That exposes files which should not be browsable — backups, configs, uploads — handing the attacker a map of the server’s files.',
      fix: 'Disable automatic listing (on nginx, `autoindex off;` — which is already the default; on Apache, remove `Options +Indexes`).',
      gain: 'Files stop being browsable without an explicit link.',
    },
  },
};
