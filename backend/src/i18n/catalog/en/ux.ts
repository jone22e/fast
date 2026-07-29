import type { PluginCatalog } from '../../types.js';

export const ux: PluginCatalog = {
  name: 'UX',
  description:
    'Visual consistency, navigation, hierarchy, CTAs, forms and time to interactivity.',
  checks: {
    typography: 'Typographic consistency',
    'color-palette': 'Contained colour palette',
    nav: 'Main navigation present',
    'internal-nav': 'Enough internal links',
    hierarchy: 'Clear visual hierarchy',
    cta: 'Identifiable calls to action',
    'cta-quality': 'CTAs with descriptive text',
    'forms-submit': 'Forms with a submit button',
    'forms-length': 'Forms of a reasonable length',
    interactivity: 'Time until the page responds',
    inp: 'Interaction response (INP)',
    clickable: 'Interactive elements present',
    footer: 'Structured footer',
  },
  issues: {
    'ux-too-many-fonts': {
      title: '{0} different font families',
      description:
        'Too many fonts fragment the visual identity and add weight to the page, since each family requires downloading its own files.',
      fix: 'Cut down to 2 families (one for headings, one for body) and use different weights of the same family to create variation.',
      gain: 'A more cohesive visual identity and fewer font bytes.',
    },
    'ux-no-nav': {
      title: 'No <nav> navigation element',
      description:
        'No semantically marked main navigation was found, which makes it harder for the user to get oriented and for machines to understand the site structure.',
      fix: 'Wrap the main menu in <nav> and add an aria-label when there is more than one navigation block.',
      gain: 'A clear navigation structure for users and for assistive technology.',
    },
    'ux-no-cta': {
      title: 'No call to action identified',
      description:
        'The page shows no obvious action buttons or links — the visitor arrives, reads, and has no idea what the next step is.',
      fix: 'Add a visible primary CTA above the fold, with a clear action verb ("Start now", "Request a demo") and standout contrast.',
      gain: 'A direct lift in conversion rate.',
    },
    'ux-form-no-submit': {
      title: '{0} form(s) without a visible submit button',
      description:
        'Forms that rely on the Enter key alone leave part of the users unsure how to finish.',
      fix: 'Add an explicit <button type="submit"> to every form.',
      gain: 'Fewer abandoned forms.',
    },
    'ux-long-forms': {
      title: '{0} form(s) with more than 7 fields',
      description:
        'The largest has {0} fields. Each extra field measurably reduces the completion rate.',
      fix: 'Cut down to the fields you truly need, group the rest into steps, and collect additional data after the initial conversion.',
      gain: 'A typical 10% to 25% lift in form completion.',
    },
    'ux-slow-interaction': {
      title: 'Page is unresponsive for {0} during load',
      description:
        'Clicks made in that window are queued or lost, and the interface feels frozen to the user.',
      fix: 'Defer non-essential scripts, break long tasks into chunks with scheduler.yield() or setTimeout, and hydrate components on demand.',
      gain: 'A responsive interface from the first visible moment.',
    },
  },
};
