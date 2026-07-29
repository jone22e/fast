<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue';
import { useI18n } from '@/i18n';
import type { AiAnalysis } from '@/types';

const props = defineProps<{ ai: AiAnalysis; open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const { t } = useI18n();

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') emit('close');
}

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
    <Transition name="modal">
      <div v-if="open" class="overlay" @click.self="emit('close')">
        <div class="modal" role="dialog" aria-modal="true" :aria-label="t.ai.title">
          <!-- Cabeçalho -->
          <header class="head">
            <img class="avatar" src="/favicon.svg" alt="" width="38" height="38" />
            <div class="who">
              <strong>{{ t.ai.title }}</strong>
              <span>{{ t.ai.subtitle }}</span>
            </div>
            <button class="close" :aria-label="t.ai.close" @click="emit('close')">
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M4 4l10 10M14 4L4 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </button>
          </header>

          <div class="body">
            <template v-if="ai.available">
              <!-- Resumo executivo -->
              <section class="summary">
                <span class="eyebrow">{{ t.ai.executive }}</span>
                <p>{{ ai.executiveSummary }}</p>
              </section>

              <!-- Problemas + Prioridades lado a lado -->
              <div class="cols">
                <section v-if="ai.mainProblems.length" class="panel">
                  <h3>
                    <svg viewBox="0 0 20 20" aria-hidden="true" class="i-warn">
                      <path d="M10 2l8 15H2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
                      <path d="M10 8v4M10 14.5v.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                    </svg>
                    {{ t.ai.mainProblems }}
                  </h3>
                  <ul class="problems">
                    <li v-for="(p, i) in ai.mainProblems" :key="i">
                      <span class="mk" aria-hidden="true"></span>
                      <span>{{ p }}</span>
                    </li>
                  </ul>
                </section>

                <section v-if="ai.priorities.length" class="panel">
                  <h3>
                    <svg viewBox="0 0 20 20" aria-hidden="true" class="i-list">
                      <path d="M7 5h10M7 10h10M7 15h10M3 5h.01M3 10h.01M3 15h.01" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                    </svg>
                    {{ t.ai.priorities }}
                  </h3>
                  <ol class="priorities">
                    <li v-for="(p, i) in ai.priorities" :key="i">
                      <span class="rank">{{ i + 1 }}</span>
                      <span>{{ p }}</span>
                    </li>
                  </ol>
                </section>
              </div>

              <!-- Impacto -->
              <section v-if="ai.impacts" class="panel wide">
                <h3>
                  <svg viewBox="0 0 20 20" aria-hidden="true" class="i-impact">
                    <path d="M3 16h14M5 16V9M9.5 16V5M14 16v-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  </svg>
                  {{ t.ai.impacts }}
                </h3>
                <p class="prose">{{ ai.impacts }}</p>
              </section>

              <!-- Ganhos -->
              <section v-if="ai.estimatedGains" class="gains">
                <h3>
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M3 13l5-5 3 3 5-6M13 2h4v4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  {{ t.ai.gains }}
                </h3>
                <p>{{ ai.estimatedGains }}</p>
              </section>

              <!-- Notas técnicas -->
              <section v-if="ai.technicalNotes.length" class="panel wide">
                <h3>
                  <svg viewBox="0 0 20 20" aria-hidden="true" class="i-notes">
                    <path d="M7 4L3 10l4 6M13 4l4 6-4 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  {{ t.ai.notes }}
                </h3>
                <ul class="notes">
                  <li v-for="(n, i) in ai.technicalNotes" :key="i">{{ n }}</li>
                </ul>
              </section>

              <p class="foot">
                {{ t.ai.foot }}
              </p>
            </template>

            <div v-else class="off">
              <p>{{ ai.error || t.ai.unavailable }}</p>
              <p class="dim">{{ t.ai.unavailableHint }}</p>
            </div>
          </div>
        </div>
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
  align-items: center;
  justify-content: center;
  padding: 28px;
  background: rgba(4, 6, 10, 0.72);
  backdrop-filter: blur(4px);
}

.modal {
  width: min(940px, 100%);
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border: 1px solid var(--border-strong);
  border-radius: 18px;
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

/* ---------- cabeçalho ---------- */

.head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(120deg, rgba(79, 140, 255, 0.12), transparent 60%);
  flex-shrink: 0;
}

.avatar {
  border-radius: 10px;
  flex-shrink: 0;
}

.who {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 2px;
}

.who strong {
  font-size: 16.5px;
}

.who span {
  font-size: 13px;
  color: var(--text-dim);
}

.close {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  color: var(--text-muted);
  transition: background 0.15s, color 0.15s;
}

.close:hover {
  background: var(--bg-hover);
  color: var(--text);
}

/* ---------- corpo ---------- */

.body {
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* Resumo em destaque */
.summary {
  position: relative;
  padding: 22px 24px;
  border-radius: 14px;
  background: linear-gradient(150deg, rgba(79, 140, 255, 0.14), rgba(157, 123, 255, 0.06));
  border: 1px solid rgba(79, 140, 255, 0.28);
}

.eyebrow {
  display: block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--accent);
  margin-bottom: 10px;
}

.summary p {
  margin: 0;
  font-size: 16px;
  line-height: 1.7;
  color: var(--text);
}

/* Grid de painéis */
.cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.panel {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 20px 22px;
}

.panel h3,
.gains h3 {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13px;
  font-weight: 650;
  letter-spacing: 0.01em;
  color: var(--text);
  margin-bottom: 15px;
}

.panel h3 svg,
.gains h3 svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.i-warn { color: var(--high); }
.i-list { color: var(--accent); }
.i-impact { color: #9d7bff; }
.i-notes { color: var(--text-muted); }

/* Problemas */
.problems {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 13px;
}

.problems li {
  display: flex;
  gap: 11px;
  font-size: 14px;
  line-height: 1.55;
  color: var(--text-muted);
}

.problems .mk {
  width: 7px;
  height: 7px;
  margin-top: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--high);
  box-shadow: 0 0 0 4px rgba(255, 120, 71, 0.12);
}

/* Prioridades */
.priorities {
  list-style: none;
  margin: 0;
  padding: 0;
  counter-reset: none;
  display: grid;
  gap: 12px;
}

.priorities li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 14px;
  line-height: 1.55;
  color: var(--text-muted);
}

.rank {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 7px;
  background: var(--accent-soft);
  border: 1px solid rgba(79, 140, 255, 0.35);
  color: var(--accent);
  font-size: 12.5px;
  font-weight: 700;
}

/* Impacto / notas */
.panel.wide {
  width: 100%;
}

.prose {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.7;
  color: var(--text-muted);
}

.notes {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.notes li {
  position: relative;
  padding-left: 18px;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--text-muted);
}

.notes li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  width: 6px;
  height: 6px;
  border-radius: 2px;
  background: var(--border-strong);
}

/* Ganhos */
.gains {
  padding: 20px 22px;
  border-radius: 14px;
  background: linear-gradient(150deg, rgba(47, 212, 123, 0.12), rgba(47, 212, 123, 0.03));
  border: 1px solid rgba(47, 212, 123, 0.28);
}

.gains h3 {
  color: var(--good);
  margin-bottom: 12px;
}

.gains h3 svg {
  color: var(--good);
}

.gains p {
  margin: 0;
  font-size: 15px;
  line-height: 1.65;
  color: var(--text);
}

.foot {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--text-dim);
  border-top: 1px solid var(--border);
  padding-top: 16px;
  text-align: center;
}

.off p {
  color: var(--text-muted);
}

.off .dim {
  color: var(--text-dim);
  font-size: 13.5px;
}

/* ---------- transição (pop) ---------- */

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.22s ease;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.26s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.26s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: translateY(16px) scale(0.97);
  opacity: 0;
}

/* ---------- responsivo ---------- */

@media (max-width: 720px) {
  .overlay {
    padding: 0;
  }

  .modal {
    width: 100%;
    max-height: 100vh;
    height: 100%;
    border-radius: 0;
    border: none;
  }

  .cols {
    grid-template-columns: 1fr;
  }
}
</style>
