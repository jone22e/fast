import { config } from '../config.js';
import { runAiAnalysis } from '../plugins/ai/index.js';
import { collect } from './collector.js';
import { getPlugins } from './registry.js';
import {
  CATEGORY_LABELS,
  computePriority,
  overallScore,
  priorityRank,
  severityRank,
} from './scoring.js';
import type {
  AuditContext,
  AuditEvent,
  AuditReport,
  CategoryScore,
  Issue,
  PluginResult,
} from './types.js';

type Emit = (event: AuditEvent) => void;

/** Executa uma auditoria completa e emite eventos de progresso em tempo real. */
export async function runAudit(url: string, emit: Emit): Promise<AuditReport> {
  const startedAt = Date.now();
  const plugins = getPlugins();

  emit({
    type: 'started',
    url,
    plugins: plugins.map((p) => ({ id: p.id, name: p.name, category: p.category })),
  });

  const progress = (stage: string, message: string, percent: number): void =>
    emit({ type: 'progress', stage, message, percent });

  progress('coleta', 'Validando URL e iniciando coleta…', 2);

  const ctx: AuditContext = await withTimeout(
    collect(url, (message) => progress('coleta', message, 10)),
    config.auditTimeout,
    'Tempo limite excedido durante a coleta da página.',
  );

  progress('coleta', 'Coleta concluída. Executando módulos de auditoria…', 35);

  // Execução paralela dos plugins — cada um é independente e isolado.
  const total = plugins.length;
  let done = 0;

  const results = await Promise.all(
    plugins.map(async (plugin): Promise<PluginResult> => {
      const pluginStart = Date.now();
      emit({ type: 'plugin:start', id: plugin.id, name: plugin.name });

      try {
        const partial = await withTimeout(
          plugin.run(ctx),
          45_000,
          `Módulo ${plugin.name} excedeu o tempo limite.`,
        );

        const issues = partial.issues.map((issue) => ({
          ...issue,
          category: plugin.category,
          priority: computePriority(issue),
        }));

        const result: PluginResult = {
          id: plugin.id,
          name: plugin.name,
          description: plugin.description,
          category: plugin.category,
          score: partial.score,
          checks: partial.checks,
          issues,
          recommendations: partial.recommendations,
          evidence: partial.evidence,
          durationMs: Date.now() - pluginStart,
        };

        done += 1;
        progress('modulos', `${plugin.name} concluído.`, 35 + Math.round((done / total) * 45));
        emit({
          type: 'plugin:done',
          id: plugin.id,
          name: plugin.name,
          score: result.score,
          issues: result.issues.length,
          durationMs: result.durationMs,
        });

        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        done += 1;
        progress('modulos', `${plugin.name} falhou.`, 35 + Math.round((done / total) * 45));
        emit({ type: 'plugin:error', id: plugin.id, name: plugin.name, error: message });

        return {
          id: plugin.id,
          name: plugin.name,
          description: plugin.description,
          category: plugin.category,
          score: 0,
          checks: [],
          issues: [],
          recommendations: [],
          evidence: {},
          durationMs: Date.now() - pluginStart,
          error: message,
        };
      }
    }),
  );

  // ---- Consolidação -------------------------------------------------------
  progress('consolidacao', 'Consolidando resultados e calculando notas…', 82);

  const byCategory = new Map<string, PluginResult[]>();
  for (const result of results) {
    const list = byCategory.get(result.category) ?? [];
    list.push(result);
    byCategory.set(result.category, list);
  }

  const categories: CategoryScore[] = [...byCategory.entries()].map(([category, list]) => {
    const plugin = plugins.find((p) => p.category === category);
    const score = Math.round(list.reduce((s, r) => s + r.score, 0) / list.length);
    return {
      category: category as CategoryScore['category'],
      label: CATEGORY_LABELS[category as CategoryScore['category']],
      score,
      weight: plugin?.weight ?? 1,
      issueCount: list.reduce((s, r) => s + r.issues.length, 0),
    };
  });

  const issues: Issue[] = results
    .flatMap((r) => r.issues)
    .sort(
      (a, b) =>
        priorityRank(a.priority) - priorityRank(b.priority) ||
        severityRank(a.severity) - severityRank(b.severity) ||
        a.estimatedMinutes - b.estimatedMinutes,
    );

  const summary = {
    totalIssues: issues.length,
    critical: issues.filter((i) => i.severity === 'critical').length,
    high: issues.filter((i) => i.severity === 'high').length,
    medium: issues.filter((i) => i.severity === 'medium').length,
    low: issues.filter((i) => i.severity === 'low' || i.severity === 'info').length,
    estimatedMinutes: issues.reduce((s, i) => s + i.estimatedMinutes, 0),
  };

  const score = overallScore(categories);

  // ---- Módulo 10: interpretação por IA ------------------------------------
  progress('ia', 'Gerando análise em linguagem natural…', 88);
  const ai = await runAiAnalysis({ ctx, categories, issues, overallScore: score });

  progress('relatorio', 'Montando relatório final…', 97);

  const report: AuditReport = {
    url: ctx.url,
    finalUrl: ctx.finalUrl,
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    overallScore: score,
    categories: categories.sort((a, b) => a.score - b.score),
    plugins: results,
    issues,
    ai,
    checklist: issues.slice(0, 40).map((i) => ({
      id: i.id,
      title: i.title,
      priority: i.priority,
      done: false as const,
    })),
    summary,
  };

  progress('concluido', 'Auditoria concluída.', 100);
  emit({ type: 'report', report });

  return report;
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
