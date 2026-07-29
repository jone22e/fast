import { useI18n } from '@/i18n';
import type { Priority, Severity } from '@/types';

/**
 * Utilidades de apresentação.
 *
 * Os rótulos vêm do catálogo do idioma atual — por isso as funções leem o
 * catálogo na hora da chamada, e não em uma constante de módulo: trocar de
 * idioma precisa refletir também nas listas já renderizadas.
 */

export function scoreColor(score: number): string {
  if (score >= 90) return 'var(--good)';
  if (score >= 50) return 'var(--warn)';
  return 'var(--bad)';
}

export function scoreLabel(score: number): string {
  const { score: labels } = useI18n().t.value.labels;
  if (score >= 90) return labels.excellent;
  if (score >= 75) return labels.good;
  if (score >= 50) return labels.fair;
  return labels.poor;
}

export function severityLabel(severity: Severity): string {
  return useI18n().t.value.labels.severity[severity];
}

export function priorityLabel(priority: Priority): string {
  return useI18n().t.value.labels.priority[priority];
}

export function impactLabel(impact: string): string {
  const labels = useI18n().t.value.labels.impact;
  return labels[impact as keyof typeof labels] ?? impact;
}

export function difficultyLabel(difficulty: string): string {
  const labels = useI18n().t.value.labels.difficulty;
  return labels[difficulty as keyof typeof labels] ?? difficulty;
}

export const SEVERITY_COLOR: Record<Severity, string> = {
  critical: 'var(--critical)',
  high: 'var(--high)',
  medium: 'var(--medium)',
  low: 'var(--low)',
  info: 'var(--low)',
};

export function formatDuration(minutes: number): string {
  const labels = useI18n().t.value.labels;
  if (minutes < 60) return `${minutes} ${labels.minutes}`;
  const hours = minutes / 60;
  if (hours < 8) return `${hours.toFixed(1).replace('.0', '')} ${labels.hours}`;
  return `${(hours / 8).toFixed(1).replace('.0', '')} ${labels.workdays}`;
}

export function formatMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.round(ms)} ms`;
}
