<script setup lang="ts">
import { ref } from 'vue';
import type { Issue } from '@/types';
import { PRIORITY_LABEL, SEVERITY_COLOR, SEVERITY_LABEL, formatDuration } from '@/utils';

defineProps<{ issue: Issue; categoryLabel: string }>();

const open = ref(false);
</script>

<template>
  <li class="issue" :class="{ open }">
    <button class="head" :aria-expanded="open" @click="open = !open">
      <span class="sev" :style="{ background: SEVERITY_COLOR[issue.severity] }" aria-hidden="true"></span>

      <span class="text">
        <strong>{{ issue.title }}</strong>
        <span class="tags">
          <span class="tag">{{ categoryLabel }}</span>
          <span class="tag" :style="{ color: SEVERITY_COLOR[issue.severity] }">
            {{ SEVERITY_LABEL[issue.severity] }}
          </span>
          <span class="tag">{{ PRIORITY_LABEL[issue.priority] }}</span>
          <span class="tag">{{ formatDuration(issue.estimatedMinutes) }}</span>
        </span>
      </span>

      <svg class="chev" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
      </svg>
    </button>

    <div v-if="open" class="body">
      <p>{{ issue.description }}</p>

      <dl>
        <div>
          <dt>Como corrigir</dt>
          <dd>{{ issue.howToFix }}</dd>
        </div>
        <div>
          <dt>Ganho esperado</dt>
          <dd>{{ issue.expectedGain }}</dd>
        </div>
        <div class="meta">
          <dt>Impacto</dt>
          <dd>{{ issue.impact }}</dd>
          <dt>Dificuldade</dt>
          <dd>{{ issue.difficulty }}</dd>
          <dt>Tempo estimado</dt>
          <dd>{{ formatDuration(issue.estimatedMinutes) }}</dd>
        </div>
      </dl>

      <details v-if="issue.evidence?.length" class="evidence">
        <summary>Evidências ({{ issue.evidence.length }})</summary>
        <ul>
          <li v-for="(e, i) in issue.evidence" :key="i" class="mono">{{ e }}</li>
        </ul>
      </details>
    </div>
  </li>
</template>

<style scoped>
.issue {
  list-style: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  overflow: hidden;
  transition: border-color 0.2s;
}

.issue.open {
  border-color: var(--border-strong);
}

.head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  text-align: left;
  transition: background 0.15s;
}

.head:hover {
  background: var(--bg-hover);
}

.sev {
  width: 4px;
  align-self: stretch;
  min-height: 34px;
  border-radius: 2px;
  flex-shrink: 0;
}

.text {
  flex: 1;
  min-width: 0;
}

.text strong {
  display: block;
  font-weight: 600;
  font-size: 14.5px;
  margin-bottom: 5px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  font-size: 11.5px;
  color: var(--text-muted);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1px 7px;
  white-space: nowrap;
}

.chev {
  color: var(--text-dim);
  flex-shrink: 0;
  margin-top: 4px;
  transition: transform 0.2s;
}

.issue.open .chev {
  transform: rotate(180deg);
}

.body {
  padding: 4px 16px 18px 32px;
  border-top: 1px solid var(--border);
  animation: fade-up 0.2s ease both;
}

.body > p {
  margin: 14px 0;
  color: var(--text-muted);
  font-size: 14px;
}

dl {
  margin: 0;
  display: grid;
  gap: 14px;
}

dt {
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-dim);
  margin-bottom: 3px;
}

dd {
  margin: 0;
  font-size: 14px;
}

.meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.meta dd {
  text-transform: capitalize;
  color: var(--text-muted);
}

.evidence {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.evidence summary {
  cursor: pointer;
  font-size: 13px;
  color: var(--text-muted);
}

.evidence ul {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 6px;
}

.evidence li {
  font-size: 12px;
  color: var(--text-muted);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 6px 9px;
  word-break: break-all;
}
</style>
