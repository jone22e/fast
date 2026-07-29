import type { PluginCatalog } from '../../types.js';

export const content: PluginCatalog = {
  name: 'Content',
  description: 'Clarity, depth, readability, redundancy, scannability and thin-content signals.',
  checks: {
    'word-count': 'Content volume',
    readability: 'Readability index',
    'sentence-length': 'Average sentence length',
    scannability: 'Scannability (a heading every ~200 words)',
    structure: 'Use of lists and tables',
    'keyword-density': 'Healthy keyword density',
    redundancy: 'Low redundancy',
    promotional: 'Balance between content and promotion',
    depth: 'Depth of argument',
    vocabulary: 'Vocabulary richness',
  },
  issues: {
    'content-thin': {
      title: 'Thin content ({0} words)',
      description:
        'Pages with little text rarely answer the user’s intent in full, and are passed over both by search engines and by AI models, which need enough material to extract an answer from.',
      fix: 'Expand the content to cover the audience’s real questions: context, how it works, who it is for, comparisons and examples. Aim for 600+ words of substance, not filler.',
      gain: 'Coverage of more search terms and a better chance of being quoted by AI.',
    },
    'content-hard-to-read': {
      title: 'Hard-to-read text (index {0}/100)',
      description:
        'Sentences averaging {0} words and a long-form vocabulary make reading tiring and cut time on page.',
      fix: 'Break long sentences in two, prefer the active voice, replace unnecessary jargon, and keep paragraphs to 3 or 4 lines.',
      gain: 'Longer time on page and a lower bounce rate.',
    },
    'content-no-structure': {
      title: 'Long text with no section breaks',
      description:
        '{0} words with only {1} heading(s). Dense blocks of text are hard to scan and hard to segment automatically.',
      fix: 'Split the content into sections of 150 to 300 words, each with a descriptive H2 or H3.',
      gain: 'Faster reading and better extraction by AI engines.',
    },
    'content-keyword-stuffing': {
      title: 'Excessive repetition of the term "{0}" ({1}%)',
      description:
        'A density above 4% reads as manipulation to search engines and makes the text feel artificial to the reader.',
      fix: 'Replace repetitions with synonyms and natural variations, and rewrite the sentences where the term feels forced.',
      gain: 'More natural text and a lower risk of penalty.',
    },
    'content-duplicate': {
      title: '{0} repeated sentences in the content',
      description:
        'Repeated passages point to template-generated content or insufficient editing, and lower the perceived value of the page.',
      fix: 'Edit the text to drop redundant paragraphs and consolidate repeated information.',
      gain: 'More information per word read.',
    },
    'content-too-promotional': {
      title: 'Too much promotional language',
      description:
        '{0} promotional phrases across {1} words. Predominantly promotional content is devalued by search engines and rarely quoted by AI as an informative source.',
      fix: 'Balance the page: inform first (what it is, how it works, who it is for), sell after. Keep the CTAs, but cut the repetition.',
      gain: 'More reader trust and better standing as an informative source.',
    },
  },
};
