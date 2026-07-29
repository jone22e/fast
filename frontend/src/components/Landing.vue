<script setup lang="ts">
import Icon from './Icon.vue';
import { useI18n } from '@/i18n';

/**
 * Conteúdo institucional da página inicial — o que aparece conforme se rola.
 *
 * A página é escrita para dois leitores ao mesmo tempo: a pessoa que quer
 * entender o que a ferramenta faz antes de digitar uma URL, e o modelo de
 * linguagem que vai resumir a FAST em uma resposta. Daí a estrutura explícita
 * (definições, tabela comparativa, passo a passo, FAQ e um resumo final) e as
 * referências externas ao final.
 *
 * Os textos vêm do catálogo de idioma; aqui fica só a estrutura.
 */
const { t } = useI18n();

/** Ícone de cada módulo, na mesma ordem do catálogo. */
const MODULE_ICONS = [
  'performance',
  'seo',
  'geo',
  'content',
  'accessibility',
  'security',
  'protection',
  'infrastructure',
  'mobile',
  'ux',
];

const STEP_ICONS = ['link', 'eye', 'layers', 'ai'];
</script>

<template>
  <div class="landing">
    <!-- ================= O que a FAST analisa ================= -->
    <section id="modulos" class="block" aria-labelledby="modulos-title">
      <header v-reveal class="block-head">
        <span class="eyebrow"><Icon name="layers" :size="15" /> {{ t.landing.modules.eyebrow }}</span>
        <h2 id="modulos-title">{{ t.landing.modules.title }}</h2>
        <p>{{ t.landing.modules.intro }}</p>
      </header>

      <ul class="modules">
        <li v-for="(m, i) in t.landing.modules.items" :key="m.name" v-reveal="i * 45" class="module">
          <span class="module-icon"><Icon :name="MODULE_ICONS[i]" :size="21" /></span>
          <div class="module-body">
            <h3>{{ m.name }}</h3>
            <p>{{ m.desc }}</p>
          </div>
          <span class="module-count">{{ m.checks }} {{ t.landing.modules.checksLabel }}</span>
        </li>
      </ul>
    </section>

    <!-- ================= Como funciona ================= -->
    <section id="como-funciona" class="block" aria-labelledby="como-title">
      <header v-reveal class="block-head">
        <span class="eyebrow"><Icon name="target" :size="15" /> {{ t.landing.steps.eyebrow }}</span>
        <h2 id="como-title">{{ t.landing.steps.title }}</h2>
        <p>{{ t.landing.steps.intro }}</p>
      </header>

      <ol class="steps">
        <li v-for="(s, i) in t.landing.steps.items" :key="s.title" v-reveal="i * 70" class="step">
          <span class="step-num">{{ i + 1 }}</span>
          <span class="step-icon"><Icon :name="STEP_ICONS[i]" :size="19" /></span>
          <h3>{{ s.title }}</h3>
          <p>{{ s.desc }}</p>
        </li>
      </ol>

      <figure v-reveal class="pipeline">
        <div class="pipeline-flow" aria-hidden="true">
          <template v-for="(node, i) in t.landing.steps.flow" :key="node">
            <span class="node" :class="{ accent: i === 2 }">{{ node }}</span>
            <span v-if="i < t.landing.steps.flow.length - 1" class="arrow">
              <Icon name="arrowRight" :size="16" />
            </span>
          </template>
        </div>
        <figcaption>{{ t.landing.steps.figure }}</figcaption>
      </figure>
    </section>

    <!-- ================= Diferencial ================= -->
    <section id="diferencial" class="block" aria-labelledby="dif-title">
      <header v-reveal class="block-head">
        <span class="eyebrow"><Icon name="chart" :size="15" /> {{ t.landing.comparison.eyebrow }}</span>
        <h2 id="dif-title">{{ t.landing.comparison.title }}</h2>
        <p>{{ t.landing.comparison.intro }}</p>
      </header>

      <div v-reveal class="table-wrap">
        <table>
          <caption class="sr-only">{{ t.landing.comparison.caption }}</caption>
          <thead>
            <tr>
              <th scope="col">{{ t.landing.comparison.colFeature }}</th>
              <th scope="col">{{ t.landing.comparison.colFast }}</th>
              <th scope="col">{{ t.landing.comparison.colOthers }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in t.landing.comparison.rows" :key="row.feature">
              <th scope="row">{{ row.feature }}</th>
              <td>
                <span class="yes">
                  <Icon name="check" :size="15" />
                  <span class="sr-only">{{ t.landing.comparison.yes }}</span>
                </span>
              </td>
              <td>
                <span v-if="row.pagespeed === true" class="yes">
                  <Icon name="check" :size="15" />
                  <span class="sr-only">{{ t.landing.comparison.yes }}</span>
                </span>
                <span v-else-if="row.pagespeed === 'partial'" class="partial">
                  {{ t.landing.comparison.partial }}
                </span>
                <span v-else class="no" :aria-label="t.landing.comparison.no">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ================= Glossário ================= -->
    <section id="glossario" class="block" aria-labelledby="glossario-title">
      <header v-reveal class="block-head">
        <span class="eyebrow"><Icon name="book" :size="15" /> {{ t.landing.glossary.eyebrow }}</span>
        <h2 id="glossario-title">{{ t.landing.glossary.title }}</h2>
        <p>{{ t.landing.glossary.intro }}</p>
      </header>

      <dl class="glossary">
        <div v-for="(g, i) in t.landing.glossary.terms" :key="g.term" v-reveal="i * 45" class="term">
          <dt>{{ g.term }}</dt>
          <dd>{{ g.def }}</dd>
        </div>
      </dl>
    </section>

    <!-- ================= FAQ ================= -->
    <section id="faq" class="block" aria-labelledby="faq-title">
      <header v-reveal class="block-head">
        <span class="eyebrow"><Icon name="alert" :size="15" /> {{ t.landing.faq.eyebrow }}</span>
        <h2 id="faq-title">{{ t.landing.faq.title }}</h2>
      </header>

      <div class="faq">
        <details v-for="(f, i) in t.landing.faq.items" :key="f.q" v-reveal="i * 35">
          <summary>
            <span>{{ f.q }}</span>
            <Icon class="faq-chev" name="arrowDown" :size="17" />
          </summary>
          <p>{{ f.a }}</p>
        </details>
      </div>
    </section>

    <!-- ================= Resumo + referências ================= -->
    <section id="resumo" class="block" aria-labelledby="resumo-title">
      <div class="wrap-up">
        <article v-reveal class="summary card">
          <span class="eyebrow"><Icon name="check" :size="15" /> {{ t.landing.summary.eyebrow }}</span>
          <h2 id="resumo-title">{{ t.landing.summary.title }}</h2>
          <ul>
            <li v-for="point in t.landing.summary.points" :key="point">{{ point }}</li>
          </ul>
          <a class="summary-cta" href="#analise">
            {{ t.landing.summary.cta }}
            <Icon name="arrowRight" :size="16" />
          </a>
        </article>

        <aside v-reveal="80" class="refs card" aria-labelledby="refs-title">
          <span class="eyebrow"><Icon name="link" :size="15" /> {{ t.landing.refs.eyebrow }}</span>
          <h2 id="refs-title">{{ t.landing.refs.title }}</h2>
          <p>{{ t.landing.refs.intro }}</p>
          <ul>
            <li v-for="r in t.landing.refs.items" :key="r.url">
              <a :href="r.url" target="_blank" rel="noopener noreferrer">{{ r.label }}</a>
            </li>
          </ul>
        </aside>
      </div>
    </section>
  </div>
</template>

<style scoped>
.landing {
  display: grid;
  gap: clamp(64px, 9vw, 104px);
  padding-top: clamp(48px, 7vw, 80px);
}

/* ---------- estrutura de bloco ---------- */

.block {
  display: grid;
  gap: 30px;
  scroll-margin-top: 80px;
}

.block-head {
  max-width: 760px;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 650;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent);
  margin-bottom: 12px;
}

.block-head h2 {
  font-size: clamp(23px, 3vw, 31px);
  margin-bottom: 14px;
}

.block-head p {
  margin: 0;
  color: var(--text-muted);
  font-size: 15.5px;
  line-height: 1.75;
}

/* ---------- módulos ---------- */

.modules {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}

.module {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  padding: 20px 22px 44px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: border-color 0.2s, transform 0.2s, background 0.2s;
}

.module:hover {
  border-color: var(--border-strong);
  background: var(--bg-elevated);
  transform: translateY(-2px);
}

.module-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 11px;
  color: var(--accent);
  background: var(--accent-soft);
  border: 1px solid rgba(79, 140, 255, 0.22);
}

.module-body h3 {
  font-size: 16px;
  margin-bottom: 6px;
}

.module-body p {
  margin: 0;
  font-size: 13.8px;
  line-height: 1.65;
  color: var(--text-muted);
}

.module-count {
  position: absolute;
  left: 22px;
  bottom: 16px;
  font-size: 11.5px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-dim);
}

/* ---------- passos ---------- */

.steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 14px;
}

.step {
  position: relative;
  padding: 22px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.step-num {
  position: absolute;
  top: 18px;
  right: 20px;
  font-size: 34px;
  font-weight: 750;
  line-height: 1;
  color: var(--border-strong);
  font-variant-numeric: tabular-nums;
}

.step-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  color: var(--accent);
  background: var(--accent-soft);
  margin-bottom: 14px;
}

.step h3 {
  font-size: 15.5px;
  margin-bottom: 7px;
  padding-right: 34px;
}

.step p {
  margin: 0;
  font-size: 13.8px;
  line-height: 1.65;
  color: var(--text-muted);
}

/* ---------- figura do fluxo ---------- */

.pipeline {
  margin: 0;
  padding: 22px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: linear-gradient(150deg, rgba(79, 140, 255, 0.06), var(--bg-card) 60%);
}

.pipeline-flow {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 10px;
}

.node {
  font-size: 13px;
  color: var(--text-muted);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 7px 14px;
  white-space: nowrap;
}

.node.accent {
  color: var(--accent);
  border-color: rgba(79, 140, 255, 0.4);
  background: var(--accent-soft);
}

.arrow {
  color: var(--text-dim);
  display: grid;
  place-items: center;
}

.pipeline figcaption {
  margin-top: 16px;
  font-size: 13px;
  line-height: 1.65;
  color: var(--text-dim);
  max-width: 720px;
}

/* ---------- tabela ---------- */

.table-wrap {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-card);
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  min-width: 560px;
}

thead th {
  text-align: left;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-dim);
  font-weight: 600;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

thead th:not(:first-child),
tbody td {
  text-align: center;
  width: 170px;
}

tbody th {
  text-align: left;
  font-weight: 500;
  color: var(--text-muted);
  padding: 13px 20px;
}

tbody td {
  padding: 13px 20px;
}

tbody tr + tr th,
tbody tr + tr td {
  border-top: 1px solid var(--border);
}

tbody tr:hover th,
tbody tr:hover td {
  background: var(--bg-hover);
}

.yes {
  display: inline-grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: var(--good);
  background: rgba(47, 212, 123, 0.12);
}

.partial {
  font-size: 12px;
  color: var(--warn);
}

.no {
  color: var(--text-dim);
}

/* ---------- glossário ---------- */

.glossary {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 14px;
}

.term {
  padding: 20px 22px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-left: 2px solid var(--accent);
  border-radius: var(--radius);
}

.term dt {
  font-weight: 650;
  font-size: 15px;
  margin-bottom: 7px;
}

.term dd {
  margin: 0;
  font-size: 13.8px;
  line-height: 1.7;
  color: var(--text-muted);
}

/* ---------- FAQ ---------- */

.faq {
  display: grid;
  gap: 9px;
  max-width: 900px;
}

.faq details {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  padding: 0 20px;
  transition: border-color 0.2s;
}

.faq details[open] {
  border-color: var(--border-strong);
}

.faq summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  cursor: pointer;
  padding: 16px 0;
  font-size: 15px;
  font-weight: 600;
  list-style: none;
}

.faq summary::-webkit-details-marker {
  display: none;
}

.faq-chev {
  color: var(--text-dim);
  transition: transform 0.2s;
}

.faq details[open] .faq-chev {
  transform: rotate(180deg);
  color: var(--accent);
}

.faq details p {
  margin: 0 0 18px;
  color: var(--text-muted);
  font-size: 14.2px;
  line-height: 1.75;
  max-width: 78ch;
}

/* ---------- resumo e referências ---------- */

.wrap-up {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.summary h2,
.refs h2 {
  font-size: 21px;
  margin-bottom: 14px;
}

.summary ul {
  margin: 0 0 22px;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
}

.summary li {
  position: relative;
  padding-left: 26px;
  font-size: 14.5px;
  line-height: 1.65;
  color: var(--text-muted);
}

.summary li::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 9px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}

.summary-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--accent-btn);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  padding: 11px 20px;
  transition: background 0.2s;
}

.summary-cta:hover {
  background: var(--accent-btn-hover);
  text-decoration: none;
}

.refs p {
  font-size: 13.5px;
  color: var(--text-muted);
  margin-bottom: 14px;
}

.refs ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 9px;
}

.refs li a {
  display: block;
  font-size: 13.5px;
  color: var(--text-muted);
  border-bottom: 1px solid transparent;
  transition: color 0.15s;
}

.refs li a:hover {
  color: var(--accent);
  text-decoration: none;
  border-bottom-color: var(--border-strong);
}

@media (max-width: 900px) {
  .wrap-up {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .modules,
  .glossary {
    grid-template-columns: 1fr;
  }

  .step-num {
    font-size: 26px;
  }
}
</style>
