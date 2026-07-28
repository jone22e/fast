<script setup lang="ts">
import type { AiAnalysis } from '@/types';

defineProps<{ ai: AiAnalysis }>();
</script>

<template>
  <section class="ai card fade-up">
    <header>
      <span class="badge">Módulo 10 · Inteligência Artificial</span>
      <h2>Análise e plano de ação</h2>
    </header>

    <div v-if="!ai.available" class="off">
      <p>{{ ai.error || 'Análise por IA indisponível.' }}</p>
      <p class="dim">
        A auditoria técnica foi concluída normalmente — apenas a interpretação em linguagem natural
        não foi gerada.
      </p>
    </div>

    <template v-else>
      <p class="summary">{{ ai.executiveSummary }}</p>

      <div class="grid">
        <div v-if="ai.mainProblems.length" class="block">
          <h3>Principais problemas</h3>
          <ul>
            <li v-for="(p, i) in ai.mainProblems" :key="i">{{ p }}</li>
          </ul>
        </div>

        <div v-if="ai.priorities.length" class="block">
          <h3>Ordem de prioridade</h3>
          <ol>
            <li v-for="(p, i) in ai.priorities" :key="i">{{ p }}</li>
          </ol>
        </div>
      </div>

      <div v-if="ai.impacts" class="block">
        <h3>Impacto no negócio</h3>
        <p>{{ ai.impacts }}</p>
      </div>

      <div v-if="ai.estimatedGains" class="block gain">
        <h3>Ganhos estimados</h3>
        <p>{{ ai.estimatedGains }}</p>
      </div>

      <div v-if="ai.actionPlan.length" class="block">
        <h3>Plano de ação</h3>
        <ol class="plan">
          <li v-for="step in ai.actionPlan" :key="step.step">
            <span class="num">{{ step.step }}</span>
            <div>
              <strong>{{ step.title }}</strong>
              <span class="effort">{{ step.effort }}</span>
              <p>{{ step.detail }}</p>
            </div>
          </li>
        </ol>
      </div>

      <details v-if="ai.technicalNotes.length" class="notes">
        <summary>Notas técnicas ({{ ai.technicalNotes.length }})</summary>
        <ul>
          <li v-for="(n, i) in ai.technicalNotes" :key="i">{{ n }}</li>
        </ul>
      </details>
    </template>
  </section>
</template>

<style scoped>
.ai {
  background: linear-gradient(160deg, rgba(79, 140, 255, 0.07), var(--bg-card) 45%);
  border-color: rgba(79, 140, 255, 0.28);
}

header {
  margin-bottom: 18px;
}

.badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
  background: var(--accent-soft);
  border: 1px solid rgba(79, 140, 255, 0.3);
  border-radius: 20px;
  padding: 3px 11px;
  margin-bottom: 10px;
}

h2 {
  font-size: 21px;
}

h3 {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-dim);
  margin-bottom: 10px;
}

.summary {
  font-size: 16px;
  line-height: 1.65;
  margin-bottom: 26px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 26px;
  margin-bottom: 26px;
}

.block {
  margin-bottom: 26px;
}

.block:last-of-type {
  margin-bottom: 0;
}

.block p {
  margin: 0;
  color: var(--text-muted);
  font-size: 14.5px;
}

.block ul,
.block ol {
  margin: 0;
  padding-left: 20px;
  display: grid;
  gap: 8px;
  color: var(--text-muted);
  font-size: 14.5px;
}

.gain {
  background: rgba(47, 212, 123, 0.07);
  border: 1px solid rgba(47, 212, 123, 0.22);
  border-radius: var(--radius-sm);
  padding: 16px 18px;
}

.gain p {
  color: var(--text);
}

.plan {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 14px;
}

.plan li {
  display: flex;
  gap: 14px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
}

.num {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--accent-soft);
  border: 1px solid rgba(79, 140, 255, 0.35);
  color: var(--accent);
  font-size: 13px;
  font-weight: 700;
}

.plan strong {
  font-size: 15px;
}

.effort {
  display: inline-block;
  margin-left: 9px;
  font-size: 11.5px;
  color: var(--text-dim);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1px 6px;
}

.plan p {
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--text-muted);
}

.notes {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
}

.notes summary {
  cursor: pointer;
  font-size: 13.5px;
  color: var(--text-muted);
}

.notes ul {
  margin: 12px 0 0;
  padding-left: 20px;
  display: grid;
  gap: 7px;
  font-size: 14px;
  color: var(--text-muted);
}

.off p {
  color: var(--text-muted);
}
</style>
