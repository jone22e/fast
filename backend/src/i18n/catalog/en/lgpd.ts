import type { PluginCatalog } from '../../types.js';

export const lgpd: PluginCatalog = {
  name: 'LGPD',
  description:
    "Observable compliance with Brazil's General Data Protection Law: consent before tracking, cookies set without authorisation, privacy policy, data protection officer (DPO) and data collection forms.",
  checks: {
    'consent-banner': 'Consent banner present',
    cmp: 'Consent platform identified',
    'no-tracking-before-consent': 'No trackers before consent',
    'no-cookies-before-consent': 'No non-essential cookies before consent',
    'cookie-expiry': 'Cookies with a reasonable lifetime',
    'third-party-cookies': 'Few third-party cookies',
    'privacy-policy': 'Privacy policy reachable',
    'policy-lgpd-terms': 'Policy cites the LGPD and data subject rights',
    'dpo-contact': 'Data protection officer (DPO) identified',
    terms: 'Terms of use published',
    'form-notice': 'Forms with a privacy notice',
    'form-method': 'Personal data does not travel in the URL',
    'form-https': 'Forms submit over HTTPS',
  },
  issues: {
    'lgpd-tracking-no-consent': {
      title: '{0} tracker(s) loaded without consent',
      description:
        'The page fires trackers the moment it opens, without asking permission and without offering a way to refuse. Since the audit clicked nothing, that loading happened with no input at all from the visitor — the situation Brazil’s data protection authority (ANPD) has been treating as processing without an adequate legal basis. Each tracker sends a third party the address visited, the IP and a persistent identifier.',
      fix: 'Adopt a consent platform and keep tags blocked until the visitor chooses. In Google Tag Manager, use Consent Mode v2 with every signal denied by default and fire tags only after acceptance. The banner must make refusing as easy as accepting.',
      gain: 'Processing backed by valid consent and a substantially lower risk of an ANPD penalty.',
    },
    'lgpd-cookies-no-consent': {
      title: '{0} tracking cookie(s) set without consent',
      description:
        'Analytics and advertising cookies were written to the browser on the very first visit, before any choice. Strictly necessary cookies need no consent; measurement and marketing ones do.',
      fix: 'Classify every cookie as necessary, statistical or marketing. Write only the necessary ones before acceptance and tie the rest to the matching category in the banner. Document the list in the privacy policy.',
      gain: 'Non-essential cookies come to depend on an informed choice, as the law requires.',
    },
    'lgpd-no-consent-banner': {
      title: 'No cookie consent mechanism',
      description:
        'No banner or panel was found that lets the visitor accept, refuse or configure the use of cookies. Without one there is no way to demonstrate consent or honour a withdrawal — and demonstrating it is the controller’s duty.',
      fix: 'Deploy a banner with three equally prominent actions: accept, refuse and configure. Record the choice (date, policy version and options) and offer a permanent link to review that decision.',
      gain: 'There is finally proof of consent and a clear path to withdraw it.',
    },
    'lgpd-no-privacy-policy': {
      title: 'Privacy policy not found',
      description:
        'No link to a privacy policy or notice was found on the pages analysed. The LGPD requires stating clearly and accessibly which data is processed, for what purpose, with whom it is shared and for how long it is kept.',
      fix: 'Publish the policy at a fixed URL and link it in the footer of every page. Describe: data collected, purpose and legal basis of each processing activity, sharing with third parties, retention period, data subject rights and how to exercise them, plus the officer’s contact.',
      gain: 'The transparency the law requires and a clear channel for data subjects to exercise their rights.',
    },
    'lgpd-policy-unreachable': {
      title: 'Privacy policy unreachable',
      description:
        'The link to the policy exists, but the page did not respond as expected. A policy that will not open is, in practice, no policy at all.',
      fix: 'Fix the link target and confirm the page answers 200 without requiring a login.',
      gain: 'The policy goes back to doing its job of informing the data subject.',
    },
    'lgpd-policy-incomplete': {
      title: 'Privacy policy missing the LGPD essentials',
      description:
        'The policy exists, but it does not carry the elements the law expects to find. Missing references to: {0}. A generic text translated from another jurisdiction usually leaves out exactly what the LGPD demands.',
      fix: 'Revise the policy covering each point: an explicit mention of Law 13.709/2018, the purpose and legal basis of each processing activity, data subject rights (art. 18) and how to exercise them, the retention period and the identification of the officer.',
      gain: 'A policy aligned with what the ANPD checks, and less exposure in an inspection.',
    },
    'lgpd-no-dpo': {
      title: 'Data protection officer (DPO) not identified',
      description:
        'There is no indication of who is responsible for data processing, nor a channel to contact them. The LGPD (art. 41) requires the officer’s identity and contact to be publicly disclosed, and it is through that channel that data subjects and the ANPD reach the company.',
      fix: 'Publish in the privacy policy the name (or the responsible team) and a contact email for the officer — for example dpo@yourdomain.com. Make sure someone actually watches that inbox.',
      gain: 'Compliance with art. 41 and a formal channel for data subject requests.',
    },
    'lgpd-form-no-notice': {
      title: '{0} form(s) collect data without a privacy notice',
      description:
        'Forms ask for personal data with no consent checkbox and no link to the policy beside them. The data subject has to know, at the moment of collection, what the data will be used for.',
      fix: 'Add a short line to the form with a link to the policy ("By submitting, you agree to our Privacy Policy") and, when consent is the legal basis, a checkbox unticked by default.',
      gain: 'Informed collection and proof that the data subject was told.',
    },
    'lgpd-form-get': {
      title: '{0} form(s) send personal data in the URL',
      description:
        'A form with personal fields uses method="get": name, email or ID number end up in the address bar, in the browser history, in the server logs and in the Referer header sent to third parties. It is a personal data leak by design.',
      fix: 'Change the form method to POST. Personal data must never travel in the query string.',
      gain: 'The data stops being recorded in logs and histories outside your control.',
    },
    'lgpd-form-http': {
      title: 'Personal data form submits over HTTP',
      description:
        'The form target uses http://, so whatever is typed travels in clear text to the server. Any intermediary on the network can read it — the LGPD requires technical measures capable of protecting data from unauthorised access.',
      fix: 'Point the action at an https:// URL and confirm the destination does not redirect back to HTTP.',
      gain: 'Personal data protected in transit, as the law requires.',
    },
    'lgpd-cookie-long-lived': {
      title: '{0} cookie(s) valid for more than 13 months',
      description:
        'Non-essential cookies with a very long lifetime keep the visitor identified for years without a fresh choice. The necessity principle calls for the shortest period that still serves the purpose; 13 months is the practical benchmark for renewing consent.',
      fix: 'Reduce the max-age of analytics and marketing cookies to 13 months at most, and ask for consent again when it expires.',
      gain: 'Retention proportionate to the purpose and consent renewed periodically.',
    },
  },
};
