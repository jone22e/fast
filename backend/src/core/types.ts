/**
 * Contratos do núcleo do FAST.
 *
 * O núcleo não conhece nenhum plugin: ele recebe um contexto de auditoria
 * (coletado uma única vez) e distribui para os plugins registrados.
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type Impact = 'alto' | 'medio' | 'baixo';
export type Difficulty = 'facil' | 'media' | 'dificil';
export type Priority = 'alta' | 'media' | 'baixa';

export type CategoryId =
  | 'performance'
  | 'seo'
  | 'geo'
  | 'content'
  | 'security'
  | 'protection'
  | 'accessibility'
  | 'infrastructure'
  | 'mobile'
  | 'ux';

/** Problema encontrado por um plugin. */
export interface Issue {
  id: string;
  category: CategoryId;
  title: string;
  description: string;
  severity: Severity;
  impact: Impact;
  difficulty: Difficulty;
  /** Tempo estimado de correção, em minutos. */
  estimatedMinutes: number;
  /** Calculada pelo núcleo a partir de severidade + impacto + dificuldade. */
  priority: Priority;
  /** Como corrigir, em linguagem acessível. */
  howToFix: string;
  /** Ganho esperado após a correção. */
  expectedGain: string;
  /** Evidências: trechos de HTML, URLs, cabeçalhos, medições. */
  evidence?: string[];
}

/** Verificação individual executada por um plugin. */
export interface Check {
  id: string;
  label: string;
  /** 0..1 — quanto da verificação foi atendida. */
  score: number;
  /** Peso relativo dentro do plugin. */
  weight: number;
  /** Valor medido, para exibição no relatório. */
  value?: string;
}

/** Resultado padronizado que todo plugin devolve. */
export interface PluginResult {
  id: string;
  name: string;
  description: string;
  category: CategoryId;
  /** 0..100 */
  score: number;
  checks: Check[];
  issues: Issue[];
  recommendations: string[];
  evidence: Record<string, unknown>;
  durationMs: number;
  /** Preenchido pelo núcleo quando o plugin falha. */
  error?: string;
}

/** Problema como o plugin o declara — categoria e prioridade vêm do núcleo. */
export type PluginIssue = Omit<Issue, 'category' | 'priority'>;

/** O que o método `run` de um plugin devolve. */
export interface PluginOutput {
  score: number;
  checks: Check[];
  issues: PluginIssue[];
  recommendations: string[];
  evidence: Record<string, unknown>;
}

/** Interface padronizada de um plugin de auditoria. */
export interface AuditPlugin {
  id: string;
  name: string;
  description: string;
  category: CategoryId;
  /** Lista declarativa das verificações — exibida na UI antes da execução. */
  checks: string[];
  /** Peso da categoria na nota geral. */
  weight: number;
  run(ctx: AuditContext): Promise<PluginOutput>;
}

/** Recurso de rede carregado pela página. */
export interface NetworkResource {
  url: string;
  type: string;
  status: number;
  /** Bytes transferidos (comprimidos). */
  transferSize: number;
  /** Bytes descomprimidos. */
  resourceSize: number;
  mimeType: string;
  encoding?: string;
  cacheControl?: string;
  fromCache: boolean;
  durationMs: number;
}

/** Métricas de Core Web Vitals e afins. */
export interface PerformanceMetrics {
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  fcp: number | null;
  ttfb: number | null;
  speedIndex: number | null;
  tbt: number | null;
  domContentLoaded: number | null;
  load: number | null;
  domNodes: number | null;
  longTasks: number;
}

export interface RedirectHop {
  url: string;
  status: number;
}

/** Informações de DNS/TLS/protocolo coletadas fora do navegador. */
export interface NetworkInfo {
  protocol: string | null;
  ipAddresses: string[];
  ipv6: boolean;
  tls: {
    valid: boolean;
    issuer: string | null;
    subject: string | null;
    validFrom: string | null;
    validTo: string | null;
    daysRemaining: number | null;
    protocol: string | null;
  } | null;
  dns: {
    resolved: boolean;
    records: string[];
    ttlHint: number | null;
  };
  cdn: string | null;
  server: string | null;
}

/** Snapshot de um viewport (desktop ou mobile). */
export interface ViewportSnapshot {
  width: number;
  height: number;
  metrics: PerformanceMetrics;
  /** Elementos que estouram a largura do viewport. */
  horizontalOverflow: boolean;
  overflowingSelectors: string[];
  /** Alvos de toque menores que 44x44 CSS px. */
  smallTapTargets: { selector: string; width: number; height: number }[];
  /** Textos com fonte menor que 12px. */
  smallFonts: { selector: string; fontSize: number }[];
  screenshot?: string;
}

/** Contexto compartilhado por todos os plugins. */
export interface AuditContext {
  /** URL solicitada pelo usuário (normalizada). */
  url: string;
  /** URL final após redirecionamentos. */
  finalUrl: string;
  origin: string;
  html: string;
  /** HTML renderizado após execução de JavaScript. */
  renderedHtml: string;
  statusCode: number;
  headers: Record<string, string>;
  redirectChain: RedirectHop[];
  resources: NetworkResource[];
  desktop: ViewportSnapshot;
  mobile: ViewportSnapshot;
  network: NetworkInfo;
  robotsTxt: FetchedText | null;
  llmsTxt: FetchedText | null;
  llmsFullTxt: FetchedText | null;
  /** /.well-known/security.txt (RFC 9116) — política de divulgação responsável. */
  securityTxt: FetchedText | null;
  sitemaps: SitemapInfo[];
  /** Dados extraídos do DOM renderizado. */
  dom: DomSnapshot;
  /** Cookies definidos pela página. */
  cookies: CookieInfo[];
  /** Console/erros de página. */
  consoleErrors: string[];
  startedAt: number;
  /** Emite um evento de progresso para o cliente. */
  report(message: string): void;
}

export interface FetchedText {
  url: string;
  status: number;
  ok: boolean;
  contentType: string | null;
  encoding: string | null;
  sizeBytes: number;
  text: string;
}

export interface SitemapInfo {
  url: string;
  status: number;
  ok: boolean;
  isIndex: boolean;
  urlCount: number;
  invalidUrls: string[];
  children: string[];
}

export interface CookieInfo {
  name: string;
  domain: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: string;
  expires: number;
}

export interface HeadingInfo {
  level: number;
  text: string;
}

export interface LinkInfo {
  href: string;
  absolute: string;
  text: string;
  internal: boolean;
  rel: string | null;
  target: string | null;
}

export interface ImageInfo {
  src: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  loading: string | null;
  naturalWidth: number | null;
  naturalHeight: number | null;
  displayWidth: number | null;
  displayHeight: number | null;
  hasSrcset: boolean;
  transferSize: number | null;
  format: string | null;
}

/** Dados extraídos do DOM, prontos para os plugins consumirem. */
export interface DomSnapshot {
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  robotsMeta: string | null;
  viewport: string | null;
  charset: string | null;
  lang: string | null;
  headings: HeadingInfo[];
  links: LinkInfo[];
  images: ImageInfo[];
  openGraph: Record<string, string>;
  twitter: Record<string, string>;
  jsonLd: unknown[];
  microdataTypes: string[];
  /** Contagem de tags semânticas HTML5. */
  semanticTags: Record<string, number>;
  /** Texto visível da página. */
  text: string;
  wordCount: number;
  /** Estruturas úteis para IA. */
  lists: number;
  tables: number;
  codeBlocks: number;
  definitionLists: number;
  faqBlocks: number;
  /** Metadados de autoria. */
  author: string | null;
  publishedTime: string | null;
  modifiedTime: string | null;
  timeElements: string[];
  /** Acessibilidade. */
  imagesWithoutAlt: number;
  inputsWithoutLabel: { selector: string; type: string }[];
  ariaLabels: number;
  positiveTabIndex: { selector: string; tabIndex: number }[];
  contrastIssues: { selector: string; ratio: number; text: string }[];
  focusableCount: number;
  landmarks: Record<string, number>;
  /** UX. */
  buttons: number;
  forms: {
    action: string | null;
    method: string;
    fields: number;
    hasSubmit: boolean;
    hasPassword: boolean;
  }[];
  navElements: number;
  ctaCandidates: string[];
  fontFamilies: string[];
  colorCount: number;
  /** Recursos declarados no head. */
  preloads: string[];
  prefetches: string[];
  preconnects: string[];
  renderBlockingCss: number;
  renderBlockingJs: number;
  inlineStyleBytes: number;
  inlineScriptBytes: number;
}

/** Nota consolidada de uma categoria. */
export interface CategoryScore {
  category: CategoryId;
  label: string;
  score: number;
  weight: number;
  issueCount: number;
}

/** Plano de ação gerado pela IA. */
export interface AiAnalysis {
  available: boolean;
  executiveSummary: string;
  mainProblems: string[];
  impacts: string;
  priorities: string[];
  estimatedGains: string;
  actionPlan: { step: number; title: string; detail: string; effort: string }[];
  technicalNotes: string[];
  error?: string;
}

/** Relatório final devolvido ao frontend. */
export interface AuditReport {
  url: string;
  finalUrl: string;
  generatedAt: string;
  durationMs: number;
  overallScore: number;
  categories: CategoryScore[];
  plugins: PluginResult[];
  issues: Issue[];
  ai: AiAnalysis;
  checklist: { id: string; title: string; priority: Priority; done: false }[];
  summary: {
    totalIssues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    estimatedMinutes: number;
  };
}

/** Eventos enviados por SSE durante a execução. */
export type AuditEvent =
  | { type: 'started'; url: string; plugins: { id: string; name: string; category: CategoryId }[] }
  | { type: 'progress'; stage: string; message: string; percent: number }
  | { type: 'plugin:start'; id: string; name: string }
  | { type: 'plugin:done'; id: string; name: string; score: number; issues: number; durationMs: number }
  | { type: 'plugin:error'; id: string; name: string; error: string }
  | { type: 'report'; report: AuditReport }
  | { type: 'error'; message: string };
