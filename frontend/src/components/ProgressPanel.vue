<script setup lang="ts">
import { useI18n } from '@/i18n';
import type { ModuleStatus } from '@/types';
import { scoreColor } from '@/utils';

defineProps<{
  percent: number;
  message: string;
  modules: ModuleStatus[];
}>();

const { t } = useI18n();
</script>

<template>
  <section class="panel fade-up" aria-live="polite">
    <div class="head">
      <div class="spinner" aria-hidden="true"></div>
      <div>
        <h2>{{ t.progress.title }}</h2>
        <p class="muted">{{ message || t.progress.starting }}</p>
      </div>
      <span class="pct">{{ Math.round(percent) }}%</span>
    </div>

    <div class="bar" role="progressbar" :aria-valuenow="Math.round(percent)" aria-valuemin="0" aria-valuemax="100">
      <div class="fill" :style="{ width: `${percent}%` }"></div>
    </div>

    <ul v-if="modules.length" class="modules">
      <li v-for="m in modules" :key="m.id" :class="['module', m.state]">
        <span class="dot" aria-hidden="true"></span>
        <span class="name">{{ m.name }}</span>
        <span v-if="m.state === 'done'" class="score" :style="{ color: scoreColor(m.score ?? 0) }">
          {{ m.score }}
        </span>
        <span v-else-if="m.state === 'error'" class="err">{{ t.progress.failed }}</span>
        <span v-else-if="m.state === 'running'" class="running">{{ t.progress.running }}</span>
        <span v-else class="dim">{{ t.progress.queued }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.panel {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 28px;
}

.head {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.head h2 {
  font-size: 18px;
  margin-bottom: 2px;
}

.head p {
  margin: 0;
  font-size: 14px;
}

.pct {
  margin-left: auto;
  font-size: 26px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--accent);
}

.spinner {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border: 3px solid var(--border-strong);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

.bar {
  height: 6px;
  background: var(--bg-elevated);
  border-radius: 3px;
  overflow: hidden;
}

.fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), #7aa9ff);
  border-radius: 3px;
  transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.modules {
  list-style: none;
  margin: 24px 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 8px;
}

.module {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  background: var(--bg-elevated);
  border: 1px solid transparent;
  font-size: 13.5px;
  transition: background 0.2s, border-color 0.2s;
}

.module.running {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.module.done .name {
  color: var(--text);
}

.module.pending .name {
  color: var(--text-dim);
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-dim);
  flex-shrink: 0;
}

.module.running .dot {
  background: var(--accent);
  animation: pulse 1.1s ease-in-out infinite;
}

.module.done .dot {
  background: var(--good);
}

.module.error .dot {
  background: var(--bad);
}

.name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-muted);
}

.score {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.running {
  color: var(--accent);
  font-size: 12px;
}

.err {
  color: var(--bad);
  font-size: 12px;
}

.dim {
  color: var(--text-dim);
  font-size: 12px;
}
</style>
