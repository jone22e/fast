import type { Check, Difficulty, Impact, PluginIssue, Severity } from '../core/types.js';

/** Construtor enxuto de verificações. */
export function check(
  id: string,
  label: string,
  score: number,
  weight = 1,
  value?: string,
): Check {
  return { id, label, score: Math.min(1, Math.max(0, score)), weight, value };
}

interface IssueInput {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  impact: Impact;
  difficulty: Difficulty;
  minutes: number;
  fix: string;
  gain: string;
  evidence?: (string | null | undefined)[];
}

/** Construtor enxuto de problemas. */
export function issue(input: IssueInput): PluginIssue {
  return {
    id: input.id,
    title: input.title,
    description: input.description,
    severity: input.severity,
    impact: input.impact,
    difficulty: input.difficulty,
    estimatedMinutes: input.minutes,
    howToFix: input.fix,
    expectedGain: input.gain,
    evidence: (input.evidence ?? []).filter((e): e is string => Boolean(e)).slice(0, 10),
  };
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatMs(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return 'n/d';
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`;
}

/** Percentual formatado. */
export function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}
