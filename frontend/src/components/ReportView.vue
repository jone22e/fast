<script setup lang="ts">
import { computed, ref } from 'vue';
import ActionPlan from './ActionPlan.vue';
import AiModal from './AiModal.vue';
import Icon from './Icon.vue';
import IssueCard from './IssueCard.vue';
import ModuleDetail from './ModuleDetail.vue';
import ScoreRing from './ScoreRing.vue';
import { useI18n } from '@/i18n';
import type { AuditReport, CategoryId, Severity } from '@/types';
import { formatDuration, formatMs, scoreColor, scoreLabel } from '@/utils';

const props = defineProps<{ report: AuditReport }>();
const emit = defineEmits<{ 'new-audit': [] }>();

const { t, lang } = useI18n();

/** Ícone de cada categoria, para dar leitura visual às notas. */
const CATEGORY_ICONS: Record<CategoryId, string> = {
  performance: 'performance',
  seo: 'seo',
  geo: 'geo',
  content: 'content',
  security: 'security',
  protection: 'protection',
  accessibility: 'accessibility',
  infrastructure: 'infrastructure',
  mobile: 'mobile',
  ux: 'ux',
};

const pdfLoading = ref(false);
const pdfError = ref(false);

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
    _formato: t.value.jsonExport.format,
    _versao: 1,
    _instrucoes: t.value.jsonExport.instructions,
    _glossario: t.value.jsonExport.glossary,
    _idioma: lang.value,
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

async function exportPdf(): Promise<void> {
  if (pdfLoading.value) return;
  pdfLoading.value = true;
  pdfError.value = false;

  try {
    const blob = await fetchPdf();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fast-audit-${new URL(props.report.finalUrl).hostname}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    pdfError.value = true;
  } finally {
    pdfLoading.value = false;
  }
}

/**
 * Busca o PDF pelo id do relatório guardado no servidor.
 *
 * O reenvio do relatório (POST) fica como reserva, para o caso de a guarda já
 * ter expirado. Ele é o caminho arriscado: o corpo carrega os próprios textos
 * de correção — `<script>`, `eval()`, "SQL injection" — e um WAF na frente do
 * site responde 403 antes de a requisição chegar à aplicação.
 */
async function fetchPdf(): Promise<Blob> {
  const id = props.report.id;

  if (id) {
    const res = await fetch(`/api/report/pdf/${id}?lang=${lang.value}`);
    if (res.ok) return res.blob();
    // 404 = expirou; qualquer outro erro também cai para a reserva.
  }

  const res = await fetch(`/api/report/pdf?lang=${lang.value}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(props.report),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}

</script>

<template>
  <div class="report fade-up">
    <!-- ---------- Barra de ações ---------- -->
    <div class="toolbar">
      <button class="back" @click="emit('new-audit')">{{ t.report.back }}</button>
      <button
        v-if="report.ai.available"
        class="ai-btn"
        @click="aiOpen = true"
      >
        <img src="/favicon.svg" alt="" width="22" height="22" />
        {{ t.report.aiButton }}
      </button>
    </div>

    <!-- ---------- Cabeçalho com nota geral ---------- -->
    <section class="hero card">
      <div class="ring-wrap">
        <ScoreRing :score="report.overallScore" :size="168" :label="t.report.overall" />
        <span class="verdict" :style="{ color: scoreColor(report.overallScore) }">
          {{ scoreLabel(report.overallScore) }}
        </span>
      </div>

      <div class="meta">
        <h2>{{ report.finalUrl }}</h2>
        <p class="muted">
          {{ t.report.analyzedAt }} {{ new Date(report.generatedAt).toLocaleString(lang) }} ·
          {{ formatMs(report.durationMs) }} {{ t.report.runtime }}
        </p>

        <div class="stats">
          <div>
            <strong>{{ report.summary.totalIssues }}</strong>
            <span>{{ t.report.stats.issues }}</span>
          </div>
          <div>
            <strong style="color: var(--critical)">{{ report.summary.critical }}</strong>
            <span>{{ t.report.stats.critical }}</span>
          </div>
          <div>
            <strong style="color: var(--high)">{{ report.summary.high }}</strong>
            <span>{{ t.report.stats.high }}</span>
          </div>
          <div v-if="aiScore !== null">
            <strong :style="{ color: scoreColor(aiScore) }">{{ aiScore }}</strong>
            <span>{{ t.report.stats.aiScore }}</span>
          </div>
          <div>
            <strong>{{ formatDuration(report.summary.estimatedMinutes) }}</strong>
            <span>{{ t.report.stats.fixTime }}</span>
          </div>
        </div>

        <div class="exports">
          <button class="export primary" :disabled="pdfLoading" @click="exportPdf">
            <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true">
              <path d="M7.5 1v8m0 0L4.5 6m3 3l3-3M2.5 11v2h10v-2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            {{ pdfLoading ? t.report.exportingPdf : t.report.exportPdf }}
          </button>
          <button class="export" @click="exportJson">
            <Icon name="download" :size="15" />
            {{ t.report.exportJson }}
          </button>
        </div>
        <p v-if="pdfError" class="pdf-error">{{ t.report.pdfError }}</p>
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
          <span class="cat-name">
            <Icon :name="CATEGORY_ICONS[c.category]" :size="15" />
            {{ c.label }}
          </span>
          <span class="cat-score">{{ c.score }}</span>
        </div>
        <div class="cat-bar">
          <span :style="{ width: `${c.score}%` }"></span>
        </div>
        <span class="cat-issues">
          {{ c.issueCount === 0 ? t.report.noIssues : `${c.issueCount} ${t.report.issuesCount}` }}
        </span>
      </article>
    </section>

    <!-- ---------- Gatilho da análise por IA ---------- -->
    <section v-if="report.ai.available" class="ai-trigger card fade-up" @click="aiOpen = true">
      <img class="ai-icon" src="/favicon.svg" alt="" width="40" height="40" />
      <div class="ai-text">
        <span class="ai-badge">{{ t.ai.badge }}</span>
        <p>{{ report.ai.executiveSummary }}</p>
      </div>
      <button class="ai-open" @click.stop="aiOpen = true">
        {{ t.ai.open }}
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
        <h2><Icon name="alert" :size="19" /> {{ t.report.issuesTitle }}</h2>
        <div class="filters">
          <label class="sr-only" for="f-cat">{{ t.report.filterCategory }}</label>
          <select id="f-cat" v-model="filterCategory">
            <option value="all">{{ t.report.allCategories }}</option>
            <option v-for="c in report.categories" :key="c.category" :value="c.category">
              {{ c.label }} ({{ c.issueCount }})
            </option>
          </select>

          <label class="sr-only" for="f-sev">{{ t.report.filterSeverity }}</label>
          <select id="f-sev" v-model="filterSeverity">
            <option value="all">{{ t.report.allSeverities }}</option>
            <option value="critical">{{ t.labels.severity.critical }}</option>
            <option value="high">{{ t.labels.severity.high }}</option>
            <option value="medium">{{ t.labels.severity.medium }}</option>
            <option value="low">{{ t.labels.severity.low }}</option>
          </select>
        </div>
      </header>

      <p v-if="filteredIssues.length === 0" class="empty">{{ t.report.emptyFiltered }}</p>

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
      <h2><Icon name="layers" :size="19" /> {{ t.report.modulesTitle }}</h2>
      <p class="muted">{{ t.report.modulesIntro }}</p>
      <div class="module-list">
        <ModuleDetail v-for="p in report.plugins" :key="p.id" :plugin="p" />
      </div>
    </section>

    <!-- ---------- Checklist ---------- -->
    <section v-if="report.checklist.length" class="checklist card">
      <h2><Icon name="check" :size="19" /> {{ t.report.checklistTitle }}</h2>
      <p class="muted">
        {{ checked.size }}/{{ report.checklist.length }} {{ t.report.checklistProgress }}
      </p>
      <ul>
        <li v-for="item in report.checklist" :key="item.id">
          <label>
            <input type="checkbox" :checked="checked.has(item.id)" @change="toggle(item.id)" />
            <span :class="{ done: checked.has(item.id) }">{{ item.title }}</span>
            <span class="prio" :data-p="item.priority">
              {{ t.labels.priority[item.priority] }}
            </span>
          </label>
        </li>
      </ul>
    </section>

    <!-- ---------- Modal da IA ---------- -->
    <AiModal :ai="report.ai" :open="aiOpen" @close="aiOpen = false" />
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

/* ---------- barra de ações ---------- */

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  /* Em um relatório longo, voltar e abrir a análise por IA precisam continuar
     ao alcance — a barra acompanha a rolagem logo abaixo do cabeçalho. */
  position: sticky;
  top: 62px;
  z-index: 5;
  padding: 10px 0;
  margin-bottom: -6px;
  background: linear-gradient(var(--bg) 70%, transparent);
}

.back {
  font-size: 14px;
  color: var(--text-muted);
}

.back:hover {
  color: var(--accent);
}

.ai-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 15px 8px 10px;
  border-radius: 24px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-strong);
  color: var(--text);
  font-size: 13.5px;
  font-weight: 600;
  transition: border-color 0.2s, background 0.2s;
}

.ai-btn img {
  border-radius: 6px;
}

.ai-btn:hover {
  border-color: rgba(79, 140, 255, 0.5);
  background: var(--bg-hover);
}

@media (max-width: 640px) {
  .ai-trigger {
    flex-wrap: wrap;
  }

  .ai-open {
    width: 100%;
    justify-content: center;
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

.exports {
  display: flex;
  gap: 9px;
  flex-wrap: wrap;
}

.export {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  padding: 8px 15px;
  font-size: 13.5px;
  color: var(--text-muted);
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.export:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text);
}

.export.primary {
  background: var(--accent-btn);
  border-color: var(--accent-btn);
  color: #fff;
}

.export.primary:hover:not(:disabled) {
  background: var(--accent-btn-hover);
  border-color: var(--accent-btn-hover);
  color: #fff;
}

.pdf-error {
  margin: 10px 0 0;
  font-size: 12.5px;
  color: var(--bad);
}

/* ---------- categorias ---------- */

.categories {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(215px, 1fr));
  gap: 12px;
}

.cat {
  transition: border-color 0.2s, transform 0.2s;
}

.cat:hover {
  border-color: var(--border-strong);
  transform: translateY(-2px);
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
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13.5px;
  font-weight: 600;
}

.cat-name svg {
  color: var(--cat-color);
  opacity: 0.85;
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
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 19px;
}

.issues h2 svg,
.modules h2 svg,
.checklist h2 svg {
  color: var(--accent);
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
