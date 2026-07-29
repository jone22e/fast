import type { PluginCatalog } from '../../types.js';

export const mobile: PluginCatalog = {
  name: 'Mobile',
  description: 'Viewport, responsiveness, font and tap target sizes, mobile CLS and responsive images.',
  checks: {
    viewport: 'Viewport meta configured',
    zoom: 'Zoom allowed',
    'no-overflow': 'No horizontal scrolling',
    'font-size': 'Legible fonts (≥ 12px)',
    'tap-targets': 'Tap targets of at least 44×44px',
    'mobile-lcp': 'LCP on mobile',
    'mobile-cls': 'CLS on mobile',
    'responsive-images': 'Images with srcset',
  },
  issues: {
    'mobile-no-viewport': {
      description:
        'Without width=device-width, the mobile browser renders the page at desktop width (980px) and scales everything down, leaving the text unreadable.',
      fix: 'Add to the <head>: <meta name="viewport" content="width=device-width, initial-scale=1">',
      gain: 'Correct rendering on mobile devices — a prerequisite for any mobile optimisation.',
    },
    'mobile-zoom-blocked': {
      title: 'Zoom disabled in the viewport',
      description:
        'Preventing zoom blocks an essential accessibility feature for people with low vision.',
      fix: 'Remove user-scalable=no and maximum-scale=1 from the viewport meta tag.',
      gain: 'Compliance with WCAG 1.4.4 (resize text).',
    },
    'mobile-horizontal-scroll': {
      title: 'Page scrolls horizontally on mobile',
      description:
        '{0} element(s) exceed the {1}px screen width, forcing the user to scroll sideways to read the content.',
      fix: 'Find the listed elements and apply max-width: 100%, box-sizing: border-box and width: auto. Tables and code blocks belong in their own container with overflow-x: auto.',
      gain: 'Comfortable reading at any screen width.',
    },
    'mobile-small-fonts': {
      title: '{0} element(s) with a font smaller than 12px',
      description:
        'Very small text forces the user to zoom in to read, which almost always ends in leaving the page.',
      fix: 'Use at least 16px for body text and 14px for supporting text. Prefer relative units (rem) over fixed pixels.',
      gain: 'Reading without zoom and a lower mobile bounce rate.',
    },
    'mobile-small-tap-targets': {
      title: '{0} tap target(s) smaller than 44×44px',
      description:
        'Small links and buttons cause mis-taps. The 44×44 px recommendation comes from the average size of an adult fingertip.',
      fix: 'Increase the padding of interactive elements to a 44×44px clickable area and leave at least 8px between adjacent targets.',
      gain: 'Fewer mis-taps and smoother navigation on the phone.',
    },
    'mobile-cls-regression': {
      title: 'Layout far less stable on mobile (CLS {0} vs {1} on desktop)',
      description:
        'Layout shift is significantly worse on the phone, suggesting elements that only reflow on narrow screens.',
      fix: 'Reserve height for banners, carousels and ads at the mobile breakpoints, and declare dimensions on every image.',
      gain: 'Mobile CLS in the good range and fewer accidental clicks.',
    },
    'mobile-no-srcset': {
      title: 'Images without responsive variants',
      description:
        '{0} of {1} images are served at a single size. On a phone, that means downloading the desktop version onto a 390px screen.',
      fix: 'Generate variants at several widths and use srcset with sizes, or <picture> with <source media> per breakpoint.',
      gain: 'Typically 50% to 70% less image weight on mobile devices.',
    },
  },
};
