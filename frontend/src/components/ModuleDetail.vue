<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from '@/i18n';
import type { PluginResult } from '@/types';
import { scoreColor } from '@/utils';

defineProps<{ plugin: PluginResult }>();

const { t } = useI18n();
const open = ref(false);

/** Abre o detalhamento a partir de fora (clique no card da categoria). */
function expand(): void {
  open.value = true;
}

defineExpose({ expand });
</script>

<template>
  <article class="module">
    <button class="head" :aria-expanded="open" @click="open = !open">
      <span class="bar" :style="{ background: scoreColor(plugin.score) }" aria-hidden="true"></span>
      <span class="info">
        <strong>{{ plugin.name }}</strong>
        <span class="desc">{{ plugin.description }}</span>
      </span>
      <span class="score" :style="{ color: scoreColor(plugin.score) }">{{ plugin.score }}</span>
      <svg class="chev" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
      </svg>
    </button>

    <div v-if="open" class="body">
      <p v-if="plugin.error" class="error">{{ t.report.moduleFailed }} {{ plugin.error }}</p>

      <table v-if="plugin.checks.length">
        <caption class="sr-only">{{ t.report.checksCaption }} {{ plugin.name }}</caption>
        <tbody>
          <tr v-for="c in plugin.checks" :key="c.id">
            <td class="label">{{ c.label }}</td>
            <td class="value mono">{{ c.value ?? '' }}</td>
            <td class="meter">
              <span class="track">
                <span
                  class="fill"
                  :style="{ width: `${c.score * 100}%`, background: scoreColor(c.score * 100) }"
                ></span>
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="plugin.recommendations.length" class="recs">
        <h4>{{ t.report.recommendations }}</h4>
        <ul>
          <li v-for="(r, i) in plugin.recommendations" :key="i">{{ r }}</li>
        </ul>
      </div>
    </div>
  </article>
</template>

<style scoped>
.module {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  overflow: hidden;
  /* Ao rolar até o módulo, o cabeçalho fixo + a barra de ações não podem cobri-lo. */
  scroll-margin-top: 118px;
}

.head {
  display: flex;
  align-items: center;
  gap: 13px;
  width: 100%;
  padding: 14px 16px;
  text-align: left;
  transition: background 0.15s;
}

.head:hover {
  background: var(--bg-hover);
}

.bar {
  width: 4px;
  align-self: stretch;
  min-height: 34px;
  border-radius: 2px;
  flex-shrink: 0;
}

.info {
  flex: 1;
  min-width: 0;
}

.info strong {
  display: block;
  font-size: 14.5px;
  font-weight: 600;
}

.desc {
  display: block;
  font-size: 12.5px;
  color: var(--text-dim);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.score {
  font-size: 20px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.chev {
  color: var(--text-dim);
  transition: transform 0.2s;
}

.head[aria-expanded='true'] .chev {
  transform: rotate(180deg);
}

.body {
  padding: 16px;
  border-top: 1px solid var(--border);
  animation: fade-up 0.2s ease both;
}

.error {
  color: var(--bad);
  font-size: 13.5px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}

td {
  padding: 7px 0;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

tr:last-child td {
  border-bottom: none;
}

.label {
  color: var(--text-muted);
}

.value {
  color: var(--text-dim);
  font-size: 12px;
  text-align: right;
  padding-right: 14px;
  white-space: nowrap;
  max-width: 190px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meter {
  width: 110px;
}

.track {
  display: block;
  height: 5px;
  background: var(--bg-elevated);
  border-radius: 3px;
  overflow: hidden;
}

.fill {
  display: block;
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.recs {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.recs h4 {
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-dim);
  margin-bottom: 8px;
}

.recs ul {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 6px;
  font-size: 13.5px;
  color: var(--text-muted);
}

@media (max-width: 640px) {
  .value {
    display: none;
  }
}
</style>
