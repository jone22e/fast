/**
 * Contrato dos textos da interface.
 *
 * Um único formato para os quatro idiomas: o TypeScript passa a cobrar cada
 * chave nova em todas as traduções, o que evita o caso clássico de um idioma
 * ficar para trás sem ninguém perceber.
 */

export interface ModuleCopy {
  name: string;
  desc: string;
  checks: number;
}

export interface StepCopy {
  title: string;
  desc: string;
}

export interface TermCopy {
  term: string;
  def: string;
}

export interface QaCopy {
  q: string;
  a: string;
}

export interface ComparisonRow {
  feature: string;
  /** true = atende, 'partial' = parcialmente, false = não atende. */
  pagespeed: boolean | 'partial';
}

export interface Messages {
  /** Nome do idioma na própria língua, para o seletor. */
  langName: string;
  /** Código BCP 47 aplicado ao atributo lang do documento. */
  htmlLang: string;

  /** Título e descrição da aba — atualizados ao trocar de idioma. */
  meta: { title: string; description: string };

  nav: {
    tagline: string;
    cta: string;
    sections: { id: string; label: string }[];
    language: string;
  };

  hero: {
    badge: string;
    titleLead: string;
    titleAccent: string;
    lead: string;
    urlLabel: string;
    placeholder: string;
    analyze: string;
    analyzing: string;
    tryLabel: string;
    scrollCue: string;
    highlights: { icon: string; value: string; label: string }[];
  };

  landing: {
    modules: { eyebrow: string; title: string; intro: string; checksLabel: string; items: ModuleCopy[] };
    steps: { eyebrow: string; title: string; intro: string; items: StepCopy[]; figure: string; flow: string[] };
    comparison: {
      eyebrow: string;
      title: string;
      intro: string;
      caption: string;
      colFeature: string;
      colFast: string;
      colOthers: string;
      yes: string;
      no: string;
      partial: string;
      rows: ComparisonRow[];
    };
    glossary: { eyebrow: string; title: string; intro: string; terms: TermCopy[] };
    faq: { eyebrow: string; title: string; items: QaCopy[] };
    summary: { eyebrow: string; title: string; points: string[]; cta: string };
    refs: { eyebrow: string; title: string; intro: string; items: { label: string; url: string }[] };
  };

  progress: {
    title: string;
    starting: string;
    done: string;
    failed: string;
    running: string;
    queued: string;
  };

  report: {
    back: string;
    aiButton: string;
    overall: string;
    analyzedAt: string;
    runtime: string;
    stats: { issues: string; critical: string; high: string; aiScore: string; fixTime: string };
    exportPdf: string;
    exportingPdf: string;
    exportJson: string;
    pdfError: string;
    noIssues: string;
    issuesCount: string;
    viewDetails: string;
    issuesTitle: string;
    filterCategory: string;
    filterSeverity: string;
    allCategories: string;
    allSeverities: string;
    emptyFiltered: string;
    modulesTitle: string;
    modulesIntro: string;
    checklistTitle: string;
    checklistProgress: string;
    moduleFailed: string;
    recommendations: string;
    checksCaption: string;
  };

  issue: {
    howToFix: string;
    expectedGain: string;
    impact: string;
    difficulty: string;
    estimatedTime: string;
    evidence: string;
  };

  plan: { title: string; steps: string };

  /** Cabeçalho do JSON exportado — escrito para ser lido por uma IA. */
  jsonExport: {
    format: string;
    instructions: string;
    glossary: {
      overallScore: string;
      categories: string;
      plugins: string;
      issues: string;
      ai: string;
      checklist: string;
      summary: string;
    };
  };

  ai: {
    badge: string;
    open: string;
    title: string;
    subtitle: string;
    close: string;
    executive: string;
    mainProblems: string;
    priorities: string;
    impacts: string;
    gains: string;
    notes: string;
    foot: string;
    unavailable: string;
    unavailableHint: string;
  };

  labels: {
    severity: Record<'critical' | 'high' | 'medium' | 'low' | 'info', string>;
    priority: Record<'alta' | 'media' | 'baixa', string>;
    impact: Record<'alto' | 'medio' | 'baixo', string>;
    difficulty: Record<'facil' | 'media' | 'dificil', string>;
    score: { excellent: string; good: string; fair: string; poor: string };
    minutes: string;
    hours: string;
    workdays: string;
  };

  errors: { auditFailed: string; retry: string; connectionLost: string };

  footer: {
    blurb: string;
    /** Página legal do idioma — arquivo estático, fora da SPA. */
    legalUrl: string;
    privacy: string;
    /** Âncora da seção de termos dentro da página legal. */
    termsAnchor: string;
    terms: string;
    by: string;
    updated: string;
  };
}
