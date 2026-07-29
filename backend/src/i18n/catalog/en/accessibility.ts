import type { PluginCatalog } from '../../types.js';

export const accessibility: PluginCatalog = {
  name: 'Accessibility',
  description:
    'Contrast, alternative text, form labels, keyboard navigation and semantic landmarks.',
  checks: {
    alt: 'Images with an alt attribute',
    'alt-quality': 'Descriptive alt (not generic)',
    labels: 'Labelled form fields',
    contrast: 'Text contrast per WCAG AA',
    aria: 'Use of ARIA attributes',
    tabindex: 'No positive tabindex',
    landmarks: 'Navigation landmarks (header/nav/main/footer)',
    lang: 'Language declared',
    focusable: 'Focusable elements present',
    'link-text': 'Links with descriptive text',
    'link-text-quality': 'Specific link text',
  },
  issues: {
    'a11y-missing-alt': {
      title: '{0} image(s) without an alt attribute',
      description:
        'Screen readers announce the file name when there is no alt, making the information inaccessible. It is also the text shown when the image fails to load.',
      fix: 'Add a descriptive alt to every informative image. For purely decorative images, use alt="" (empty but present) so screen readers skip them.',
      gain: 'Compliance with WCAG 1.1.1 and content accessible to screen reader users.',
    },
    'a11y-unlabeled-inputs': {
      title: '{0} form field(s) without a label',
      description:
        'With no associated <label> (or aria-label), a screen reader user has no idea what to type. It is one of the most blocking accessibility failures.',
      fix: 'Associate each field with a <label for="field-id">. When a visible label is not wanted, use aria-label on the field.',
      gain: 'Forms usable with screen readers and compliance with WCAG 3.3.2.',
    },
    'a11y-contrast': {
      title: '{0} element(s) with insufficient contrast',
      description:
        'The worst case has a ratio of {0}:1, below the 4.5:1 minimum WCAG AA requires for normal text. It affects reading on bright screens, in sunlight and by people with low vision.',
      fix: 'Darken the text colour or lighten the background until it reaches 4.5:1 (3:1 for large or bold text above 18.66px). Verify with a contrast checker.',
      gain: 'Comfortable reading for every user and compliance with WCAG 1.4.3.',
    },
    'a11y-positive-tabindex': {
      title: '{0} element(s) with a positive tabindex',
      description:
        'A tabindex greater than zero forces an artificial tab order that almost always diverges from the visual order, confusing keyboard users.',
      fix: 'Use tabindex="0" to make elements focusable in the natural order, or "-1" to take them out of the tab sequence. Fix the order in the DOM, not in the tabindex.',
      gain: 'Predictable keyboard navigation.',
    },
    'a11y-no-main-landmark': {
      title: 'No <main> landmark',
      description:
        'Screen reader users rely on the main landmark to skip navigation and go straight to the content. Without it, they have to tab through the whole menu on every page.',
      fix: 'Wrap the primary content in <main> and add a "skip to content" link at the top pointing to it.',
      gain: 'Much faster navigation for assistive technology users.',
    },
    'a11y-no-lang': {
      title: 'Page language not declared',
      description:
        'Without lang, the screen reader uses the system default voice and may pronounce the content with the wrong phonetics.',
      fix: 'Add lang="en" (or the correct language) to the <html> tag.',
      gain: 'Correct pronunciation in screen readers (WCAG 3.1.1).',
    },
    'a11y-empty-links': {
      title: '{0} link(s) without accessible text',
      description:
        'Links containing only icons or images without alt are announced simply as "link" by screen readers, with no hint of the destination.',
      fix: 'Add an aria-label to the link, or a descriptive alt to the image inside it, or visually hidden text with an sr-only class.',
      gain: 'Every link becomes understandable outside the visual context.',
    },
  },
};
