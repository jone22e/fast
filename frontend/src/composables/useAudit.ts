import { ref, shallowRef } from 'vue';
import { useI18n } from '@/i18n';
import type { AuditEvent, AuditReport, ModuleStatus } from '@/types';

/**
 * Conduz uma auditoria via Server-Sent Events e mantém o estado reativo
 * do progresso. Nada é persistido: recarregar a página descarta tudo.
 */
export function useAudit() {
  const running = ref(false);
  const percent = ref(0);
  const stage = ref('');
  const message = ref('');
  const error = ref<string | null>(null);
  const modules = ref<ModuleStatus[]>([]);
  const report = shallowRef<AuditReport | null>(null);

  let source: EventSource | null = null;

  function reset(): void {
    percent.value = 0;
    stage.value = '';
    message.value = '';
    error.value = null;
    modules.value = [];
    report.value = null;
  }

  function stop(): void {
    source?.close();
    source = null;
    running.value = false;
  }

  function handle(event: AuditEvent): void {
    switch (event.type) {
      case 'started':
        modules.value = event.plugins.map((p) => ({ id: p.id, name: p.name, state: 'pending' }));
        break;

      case 'progress':
        stage.value = event.stage;
        message.value = event.message;
        percent.value = Math.max(percent.value, event.percent);
        break;

      case 'plugin:start':
        updateModule(event.id, { state: 'running' });
        break;

      case 'plugin:done':
        updateModule(event.id, {
          state: 'done',
          score: event.score,
          issues: event.issues,
          durationMs: event.durationMs,
        });
        break;

      case 'plugin:error':
        updateModule(event.id, { state: 'error', error: event.error });
        break;

      case 'report':
        report.value = event.report;
        percent.value = 100;
        stop();
        break;

      case 'error':
        error.value = event.message;
        stop();
        break;
    }
  }

  function updateModule(id: string, patch: Partial<ModuleStatus>): void {
    modules.value = modules.value.map((m) => (m.id === id ? { ...m, ...patch } : m));
  }

  function start(url: string): void {
    const { lang, t } = useI18n();

    stop();
    reset();
    running.value = true;
    message.value = t.value.progress.starting;

    // O idioma vai junto: o backend traduz o relatório e instrui a IA a
    // responder na mesma língua da interface.
    source = new EventSource(
      `/api/audit/stream?url=${encodeURIComponent(url)}&lang=${lang.value}`,
    );

    source.onmessage = (e: MessageEvent<string>) => {
      try {
        handle(JSON.parse(e.data) as AuditEvent);
      } catch {
        // Mensagem malformada: ignorada em vez de derrubar a auditoria.
      }
    };

    source.onerror = () => {
      if (report.value) {
        stop();
        return;
      }
      error.value = t.value.errors.connectionLost;
      stop();
    };
  }

  return { running, percent, stage, message, error, modules, report, start, stop, reset };
}
