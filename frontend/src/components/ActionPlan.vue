<script setup lang="ts">
import type { AiAnalysis } from '@/types';

defineProps<{ plan: AiAnalysis['actionPlan'] }>();
</script>

<template>
  <section v-if="plan.length" class="plan-section card fade-up">
    <header>
      <h2>Plano de ação</h2>
      <span class="count">{{ plan.length }} etapas</span>
    </header>

    <ol class="plan">
      <li v-for="step in plan" :key="step.step">
        <span class="num">{{ step.step }}</span>
        <div class="content">
          <div class="top">
            <strong>{{ step.title }}</strong>
            <span v-if="step.effort" class="effort">{{ step.effort }}</span>
          </div>
          <p>{{ step.detail }}</p>
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.plan-section {
  padding: 26px;
}

header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 20px;
}

h2 {
  font-size: 19px;
}

.count {
  font-size: 12.5px;
  color: var(--text-dim);
}

.plan {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
}

.plan li {
  display: flex;
  gap: 15px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 16px 18px;
  transition: border-color 0.2s, transform 0.15s;
}

.plan li:hover {
  border-color: var(--border-strong);
}

.num {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--accent-soft);
  border: 1px solid rgba(79, 140, 255, 0.35);
  color: var(--accent);
  font-size: 13.5px;
  font-weight: 700;
}

.content {
  flex: 1;
  min-width: 0;
}

.top {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 5px;
}

.top strong {
  font-size: 15px;
}

.effort {
  font-size: 11.5px;
  color: var(--text-dim);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1px 7px;
  white-space: nowrap;
}

.content p {
  margin: 0;
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.6;
}
</style>
