<script setup lang="ts">
import { computed, ref } from 'vue';
import ActionPlan from './ActionPlan.vue';
import AiDrawer from './AiDrawer.vue';
import IssueCard from './IssueCard.vue';
import ModuleDetail from './ModuleDetail.vue';
import ScoreRing from './ScoreRing.vue';
import type { AuditReport, CategoryId, Severity } from '@/types';
import { formatDuration, formatMs, scoreColor, scoreLabel } from '@/utils';

const props = defineProps<{ report: AuditReport }>();

const filterCategory = ref<CategoryId | 'all'>('all');
const filterSeverity = ref<Severity | 'all'>('all');
const checked = ref<Set<string>>(new Set());
const aiOpen = ref(false);

const categoryLabels = computed(() => {
  const map = new Map<CategoryId, string>();
  for (const c of props.report.categories) map.set(c.category, c.label);
  return map;
});

const filteredIssues = computed(() =>
  props.report.issues.filter(
    (i) =>
      (filterCategory.value === 'all' || i.category === filterCategory.value) &&
      (filterSeverity.value === 'all' || i.severity === filterSeverity.value),
  ),
);

/** Nota específica de consumo por LLMs, calculada pelo módulo GEO. */
const aiScore = computed(() => {
  const geo = props.report.plugins.find((p) => p.id === 'geo');
  const value = geo?.evidence?.aiScore;
  return typeof value === 'number' ? value : null;
});

function toggle(id: string): void {
  const next = new Set(checked.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  checked.value = next;
}

function exportJson(): void {
  // Export autoexplicativo: o relatório completo (todos os módulos, verificações,
  // evidências e a análise da IA) mais um cabeçalho que orienta uma IA externa a
  // interpretá-lo. Assim o usuário pode exportar e colar em um chat de IA.
  const r = props.report;
  const payload = {
    _formato: 'Relatório de auditoria web FAST',
    _versao: 1,
    _instrucoes:
      'Este é o relatório completo de uma auditoria automatizada do site abaixo. ' +
      'Cada módulo tem nota de 0 a 100, verificações (checks) com o valor medido, e problemas ' +
      '(issues) com gravidade, impacto, dificuldade, tempo estimado de correção, como corrigir ' +
      '(howToFix), ganho esperado (expectedGain) e evidências. O campo "ai" traz uma análise em ' +
      'linguagem natural. Use estes dados para explicar os problemas, priorizar e detalhar as ' +
      'correções. Não invente métricas que não estejam aqui.',
    _glossario: {
      overallScore: 'Nota geral de 0 a 100.',
      categories: 'Nota, peso e nº de problemas por categoria.',
      plugins: 'Cada módulo de auditoria: checks (verificações), issues (problemas) e evidence (evidências brutas).',
      issues: 'Lista consolidada de problemas, ordenada por prioridade.',
      ai: 'Interpretação por IA: resumo, prioridades, impactos, ganhos e plano de ação.',
      checklist: 'Itens de correção derivados dos problemas.',
      summary: 'Contagem de problemas por gravidade e tempo total estimado.',
    },
    ...r,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fast-audit-${new URL(r.finalUrl).hostname}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="report fade-up">
    <!-- ---------- Cabeçalho com nota geral ---------- -->
    <section class="hero card">
      <div class="ring-wrap">
        <ScoreRing :score="report.overallScore" :size="168" label="Nota geral" />
        <span class="verdict" :style="{ color: scoreColor(report.overallScore) }">
          {{ scoreLabel(report.overallScore) }}
        </span>
      </div>

      <div class="meta">
        <h2>{{ report.finalUrl }}</h2>
        <p class="muted">
          Analisado em {{ new Date(report.generatedAt).toLocaleString('pt-BR') }} ·
          {{ formatMs(report.durationMs) }} de execução
        </p>

        <div class="stats">
          <div>
            <strong>{{ report.summary.totalIssues }}</strong>
            <span>problemas</span>
          </div>
          <div>
            <strong style="color: var(--critical)">{{ report.summary.critical }}</strong>
            <span>críticos</span>
          </div>
          <div>
            <strong style="color: var(--high)">{{ report.summary.high }}</strong>
            <span>altos</span>
          </div>
          <div v-if="aiScore !== null">
            <strong :style="{ color: scoreColor(aiScore) }">{{ aiScore }}</strong>
            <span>IA Score</span>
          </div>
          <div>
            <strong>{{ formatDuration(report.summary.estimatedMinutes) }}</strong>
            <span>de correção</span>
          </div>
        </div>

        <button class="export" @click="exportJson">Exportar relatório (JSON)</button>
      </div>
    </section>

    <!-- ---------- Notas por categoria ---------- -->
    <section class="categories">
      <article
        v-for="c in report.categories"
        :key="c.category"
        class="cat card"
        :style="{ '--cat-color': scoreColor(c.score) }"
      >
        <div class="cat-head">
          <span class="cat-name">{{ c.label }}</span>
          <span class="cat-score">{{ c.score }}</span>
        </div>
        <div class="cat-bar">
          <span :style="{ width: `${c.score}%` }"></span>
        </div>
        <span class="cat-issues">
          {{ c.issueCount === 0 ? 'Sem problemas' : `${c.issueCount} problema(s)` }}
        </span>
      </article>
    </section>

    <!-- ---------- Gatilho da análise por IA ---------- -->
    <section v-if="report.ai.available" class="ai-trigger card fade-up" @click="aiOpen = true">
      <img class="ai-icon" src="/favicon.svg" alt="" width="40" height="40" />
      <div class="ai-text">
        <span class="ai-badge">Análise por IA</span>
        <p>{{ report.ai.executiveSummary }}</p>
      </div>
      <button class="ai-open" @click.stop="aiOpen = true">
        Abrir análise
        <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true">
          <path d="M5 3l5 4.5L5 12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </section>

    <div v-else-if="report.ai.error" class="ai-off card">
      <p class="muted">{{ report.ai.error }}</p>
    </div>

    <!-- ---------- Plano de ação (permanece na página) ---------- -->
    <ActionPlan :plan="report.ai.actionPlan" />

    <!-- ---------- Problemas encontrados ---------- -->
    <section class="issues card">
      <header>
        <h2>Problemas encontrados</h2>
        <div class="filters">
          <label class="sr-only" for="f-cat">Filtrar por categoria</label>
          <select id="f-cat" v-model="filterCategory">
            <option value="all">Todas as categorias</option>
            <option v-for="c in report.categories" :key="c.category" :value="c.category">
              {{ c.label }} ({{ c.issueCount }})
            </option>
          </select>

          <label class="sr-only" for="f-sev">Filtrar por gravidade</label>
          <select id="f-sev" v-model="filterSeverity">
            <option value="all">Todas as gravidades</option>
            <option value="critical">Crítico</option>
            <option value="high">Alto</option>
            <option value="medium">Médio</option>
            <option value="low">Baixo</option>
          </select>
        </div>
      </header>

      <p v-if="filteredIssues.length === 0" class="empty">
        Nenhum problema com os filtros selecionados.
      </p>

      <ul v-else class="issue-list">
        <IssueCard
          v-for="i in filteredIssues"
          :key="i.id + i.category"
          :issue="i"
          :category-label="categoryLabels.get(i.category) ?? i.category"
        />
      </ul>
    </section>

    <!-- ---------- Detalhamento por módulo ---------- -->
    <section class="modules card">
      <h2>Detalhamento por módulo</h2>
      <p class="muted">Todas as verificações executadas, com o valor medido em cada uma.</p>
      <div class="module-list">
        <ModuleDetail v-for="p in report.plugins" :key="p.id" :plugin="p" />
      </div>
    </section>

    <!-- ---------- Checklist ---------- -->
    <section v-if="report.checklist.length" class="checklist card">
      <h2>Checklist de correções</h2>
      <p class="muted">
        {{ checked.size }} de {{ report.checklist.length }} concluído(s) — o progresso é local e
        não é salvo em servidor.
      </p>
      <ul>
        <li v-for="item in report.checklist" :key="item.id">
          <label>
            <input type="checkbox" :checked="checked.has(item.id)" @change="toggle(item.id)" />
            <span :class="{ done: checked.has(item.id) }">{{ item.title }}</span>
            <span class="prio" :data-p="item.priority">{{ item.priority }}</span>
          </label>
        </li>
      </ul>
    </section>

    <!-- ---------- Drawer da IA + botão flutuante ---------- -->
    <AiDrawer :ai="report.ai" :open="aiOpen" @close="aiOpen = false" />

    <button
      v-if="report.ai.available && !aiOpen"
      class="ai-fab"
      aria-label="Abrir análise por IA"
      @click="aiOpen = true"
    >
      <img src="/favicon.svg" alt="" width="26" height="26" />
      <span>Análise IA</span>
    </button>
  </div>
</template>

<style scoped>
.report {
  display: grid;
  gap: 22px;
}

/* ---------- gatilho da IA ---------- */

.ai-trigger {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 20px 24px;
  cursor: pointer;
  background: linear-gradient(160deg, rgba(79, 140, 255, 0.09), var(--bg-card) 55%);
  border-color: rgba(79, 140, 255, 0.28);
  transition: border-color 0.2s, transform 0.15s;
}

.ai-trigger:hover {
  border-color: rgba(79, 140, 255, 0.5);
}

.ai-icon {
  border-radius: 10px;
  flex-shrink: 0;
}

.ai-text {
  flex: 1;
  min-width: 0;
}

.ai-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
  margin-bottom: 6px;
}

.ai-text p {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ai-open {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  background: var(--accent-btn);
  color: #fff;
  font-size: 13.5px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  padding: 9px 16px;
  transition: background 0.2s;
}

.ai-open:hover {
  background: var(--accent-btn-hover);
}

.ai-off {
  padding: 18px 22px;
}

/* ---------- botão flutuante ---------- */

.ai-fab {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 50;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 11px 17px 11px 12px;
  border-radius: 30px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-strong);
  box-shadow: var(--shadow);
  color: var(--text);
  font-size: 14px;
  font-weight: 600;
  transition: transform 0.15s, border-color 0.2s;
  animation: fade-up 0.4s ease both;
}

.ai-fab img {
  border-radius: 7px;
}

.ai-fab:hover {
  transform: translateY(-2px);
  border-color: rgba(79, 140, 255, 0.5);
}

@media (max-width: 640px) {
  .ai-trigger {
    flex-wrap: wrap;
  }

  .ai-open {
    width: 100%;
    justify-content: center;
  }

  .ai-fab span {
    display: none;
  }

  .ai-fab {
    padding: 12px;
    right: 16px;
    bottom: 16px;
  }
}

/* ---------- hero ---------- */

.hero {
  display: flex;
  align-items: center;
  gap: 36px;
  flex-wrap: wrap;
  padding: 32px;
}

.ring-wrap {
  display: grid;
  justify-items: center;
  gap: 10px;
}

.verdict {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.meta {
  flex: 1;
  min-width: 280px;
}

.meta h2 {
  font-size: 19px;
  word-break: break-all;
  margin-bottom: 4px;
}

.meta > p {
  font-size: 13.5px;
  margin-bottom: 20px;
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 28px;
  margin-bottom: 20px;
}

.stats div {
  display: grid;
  gap: 1px;
}

.stats strong {
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
}

.stats span {
  font-size: 12px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.export {
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  padding: 8px 15px;
  font-size: 13.5px;
  color: var(--text-muted);
  transition: background 0.15s, color 0.15s;
}

.export:hover {
  background: var(--bg-hover);
  color: var(--text);
}

/* ---------- categorias ---------- */

.categories {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 12px;
}

.cat {
  padding: 16px 18px;
}

.cat-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.cat-name {
  font-size: 13.5px;
  font-weight: 600;
}

.cat-score {
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--cat-color);
}

.cat-bar {
  height: 4px;
  background: var(--bg-elevated);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.cat-bar span {
  display: block;
  height: 100%;
  background: var(--cat-color);
  border-radius: 2px;
  transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}

.cat-issues {
  font-size: 12px;
  color: var(--text-dim);
}

/* ---------- problemas ---------- */

.issues header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 18px;
}

.issues h2,
.modules h2,
.checklist h2 {
  font-size: 19px;
}

.filters {
  display: flex;
  gap: 8px;
}

select {
  background: var(--bg-elevated);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 7px 11px;
  font-size: 13px;
  font-family: inherit;
}

.issue-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 9px;
}

.empty {
  color: var(--text-dim);
  margin: 0;
}

/* ---------- módulos ---------- */

.modules > p {
  font-size: 13.5px;
  margin-bottom: 18px;
}

.module-list {
  display: grid;
  gap: 9px;
}

/* ---------- checklist ---------- */

.checklist > p {
  font-size: 13.5px;
  margin-bottom: 16px;
}

.checklist ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 3px;
}

.checklist label {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 11px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s;
}

.checklist label:hover {
  background: var(--bg-hover);
}

.checklist input {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  flex-shrink: 0;
}

.checklist span.done {
  text-decoration: line-through;
  color: var(--text-dim);
}

.checklist label > span:first-of-type {
  flex: 1;
}

.prio {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 4px;
  padding: 1px 7px;
  border: 1px solid var(--border);
  color: var(--text-dim);
}

.prio[data-p='alta'] {
  color: var(--critical);
  border-color: rgba(255, 71, 87, 0.35);
}

.prio[data-p='media'] {
  color: var(--medium);
  border-color: rgba(255, 176, 46, 0.35);
}

@media (max-width: 640px) {
  .hero {
    padding: 24px;
    gap: 24px;
  }

  .stats {
    gap: 18px;
  }
}
</style>
