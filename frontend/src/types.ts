/** Espelho dos contratos do backend consumidos pela interface. */

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type Priority = 'alta' | 'media' | 'baixa';
export type Impact = 'alto' | 'medio' | 'baixo';
export type Difficulty = 'facil' | 'media' | 'dificil';

export type CategoryId =
  | 'performance' | 'seo' | 'geo' | 'content' | 'security' | 'protection'
  | 'accessibility' | 'infrastructure' | 'mobile' | 'ux';

export interface Issue {
  id: string;
  category: CategoryId;
  title: string;
  description: string;
  severity: Severity;
  impact: Impact;
  difficulty: Difficulty;
  estimatedMinutes: number;
  priority: Priority;
  howToFix: string;
  expectedGain: string;
  evidence?: string[];
}

export interface Check {
  id: string;
  label: string;
  score: number;
  weight: number;
  value?: string;
}

export interface PluginResult {
  id: string;
  name: string;
  description: string;
  category: CategoryId;
  score: number;
  checks: Check[];
  issues: Issue[];
  recommendations: string[];
  evidence: Record<string, unknown>;
  durationMs: number;
  error?: string;
}

export interface CategoryScore {
  category: CategoryId;
  label: string;
  score: number;
  weight: number;
  issueCount: number;
}

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
  checklist: { id: string; title: string; priority: Priority; done: boolean }[];
  summary: {
    totalIssues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    estimatedMinutes: number;
  };
}

export type AuditEvent =
  | { type: 'started'; url: string; plugins: { id: string; name: string; category: CategoryId }[] }
  | { type: 'progress'; stage: string; message: string; percent: number }
  | { type: 'plugin:start'; id: string; name: string }
  | { type: 'plugin:done'; id: string; name: string; score: number; issues: number; durationMs: number }
  | { type: 'plugin:error'; id: string; name: string; error: string }
  | { type: 'report'; report: AuditReport }
  | { type: 'error'; message: string };

export interface ModuleStatus {
  id: string;
  name: string;
  state: 'pending' | 'running' | 'done' | 'error';
  score?: number;
  issues?: number;
  durationMs?: number;
  error?: string;
}
