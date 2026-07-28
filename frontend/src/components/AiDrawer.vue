<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue';
import type { AiAnalysis } from '@/types';

const props = defineProps<{ ai: AiAnalysis; open: boolean }>();
const emit = defineEmits<{ close: [] }>();

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') emit('close');
}

// Trava a rolagem do fundo e escuta o Esc só enquanto aberto.
watch(
  () => props.open,
  (open) => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) window.addEventListener('keydown', onKey);
    else window.removeEventListener('keydown', onKey);
  },
);

onBeforeUnmount(() => {
  document.body.style.overflow = '';
  window.removeEventListener('keydown', onKey);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="open" class="overlay" @click.self="emit('close')">
        <aside class="drawer" role="dialog" aria-modal="true" aria-label="Análise por IA">
          <!-- Cabeçalho estilo chat -->
          <header class="head">
            <img class="avatar" src="/favicon.svg" alt="" width="34" height="34" />
            <div class="who">
              <strong>Análise por IA</strong>
              <span>Interpretação do relatório técnico</span>
            </div>
            <button class="close" aria-label="Fechar" @click="emit('close')">
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M4 4l10 10M14 4L4 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </button>
          </header>

          <div class="body">
            <template v-if="ai.available">
              <!-- Resumo como "mensagem" da IA -->
              <div class="bubble">
                <p class="summary">{{ ai.executiveSummary }}</p>
              </div>

              <div v-if="ai.mainProblems.length" class="block">
                <h3>Principais problemas</h3>
                <ul class="dotted">
                  <li v-for="(p, i) in ai.mainProblems" :key="i">{{ p }}</li>
                </ul>
              </div>

              <div v-if="ai.priorities.length" class="block">
                <h3>Ordem de prioridade</h3>
                <ol class="ranked">
                  <li v-for="(p, i) in ai.priorities" :key="i">{{ p }}</li>
                </ol>
              </div>

              <div v-if="ai.impacts" class="block">
                <h3>Impacto no negócio</h3>
                <p class="prose">{{ ai.impacts }}</p>
              </div>

              <div v-if="ai.estimatedGains" class="block gain">
                <h3>Ganhos estimados</h3>
                <p>{{ ai.estimatedGains }}</p>
              </div>

              <div v-if="ai.technicalNotes.length" class="block">
                <h3>Notas técnicas</h3>
                <ul class="dotted subtle">
                  <li v-for="(n, i) in ai.technicalNotes" :key="i">{{ n }}</li>
                </ul>
              </div>

              <p class="foot">
                Gerado por IA a partir dos dados da auditoria. O plano de ação detalhado está na página.
              </p>
            </template>

            <div v-else class="off">
              <p>{{ ai.error || 'Análise por IA indisponível.' }}</p>
              <p class="dim">A auditoria técnica foi concluída normalmente — apenas a interpretação em linguagem natural não foi gerada.</p>
            </div>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  justify-content: flex-end;
  background: rgba(5, 7, 11, 0.6);
  backdrop-filter: blur(3px);
}

.drawer {
  width: min(520px, 100vw);
  height: 100%;
  background: var(--bg-elevated);
  border-left: 1px solid var(--border-strong);
  box-shadow: -20px 0 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

/* ---------- cabeçalho ---------- */

.head {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(160deg, rgba(79, 140, 255, 0.1), transparent 70%);
}

.avatar {
  border-radius: 9px;
  flex-shrink: 0;
}

.who {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 1px;
}

.who strong {
  font-size: 15.5px;
}

.who span {
  font-size: 12.5px;
  color: var(--text-dim);
}

.close {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: var(--text-muted);
  transition: background 0.15s, color 0.15s;
}

.close:hover {
  background: var(--bg-hover);
  color: var(--text);
}

/* ---------- corpo ---------- */

.body {
  flex: 1;
  overflow-y: auto;
  padding: 22px 20px 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.bubble {
  background: var(--accent-soft);
  border: 1px solid rgba(79, 140, 255, 0.25);
  border-radius: 4px 14px 14px 14px;
  padding: 16px 18px;
}

.summary {
  margin: 0;
  font-size: 15.5px;
  line-height: 1.65;
}

.block h3 {
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-dim);
  margin-bottom: 11px;
}

.prose,
.gain p {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.65;
  color: var(--text-muted);
}

.dotted,
.ranked {
  margin: 0;
  padding-left: 20px;
  display: grid;
  gap: 9px;
  font-size: 14.5px;
  line-height: 1.55;
  color: var(--text-muted);
}

.dotted.subtle {
  font-size: 13.5px;
}

.ranked li::marker {
  color: var(--accent);
  font-weight: 700;
}

.gain {
  background: rgba(47, 212, 123, 0.07);
  border: 1px solid rgba(47, 212, 123, 0.22);
  border-radius: var(--radius-sm);
  padding: 15px 17px;
}

.gain p {
  color: var(--text);
}

.foot {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--text-dim);
  border-top: 1px solid var(--border);
  padding-top: 16px;
}

.off p {
  color: var(--text-muted);
}

.off .dim {
  color: var(--text-dim);
  font-size: 13.5px;
}

/* ---------- transição ---------- */

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.25s ease;
}

.drawer-enter-active .drawer,
.drawer-leave-active .drawer {
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .drawer,
.drawer-leave-to .drawer {
  transform: translateX(100%);
}
</style>
