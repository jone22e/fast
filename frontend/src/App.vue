<script setup lang="ts">
import { computed, ref } from 'vue';
import Icon from './components/Icon.vue';
import Landing from './components/Landing.vue';
import LangSwitch from './components/LangSwitch.vue';
import ProgressPanel from './components/ProgressPanel.vue';
import ReportView from './components/ReportView.vue';
import { useAudit } from '@/composables/useAudit';
import { useI18n } from '@/i18n';

const url = ref('');
const audit = useAudit();
const { t } = useI18n();

const EXAMPLES = ['vuejs.org', 'wikipedia.org', 'github.com'];

/** A página inicial só aparece enquanto não há auditoria em curso nem relatório. */
const showLanding = computed(() => !audit.report.value && !audit.running.value);

function submit(): void {
  const value = url.value.trim();
  if (!value || audit.running.value) return;
  audit.start(value);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function useExample(example: string): void {
  url.value = example;
  submit();
}

function newAudit(): void {
  audit.reset();
  url.value = '';
}
</script>

<template>
  <div class="app">
    <header class="top">
      <div class="container top-inner">
        <a class="brand" href="/">
          <img class="mark" src="/favicon.svg" alt="" width="26" height="26" />
          <span class="name">FAST</span>
          <span class="tagline">{{ t.nav.tagline }}</span>
        </a>

        <nav v-if="showLanding" class="top-nav" aria-label="FAST">
          <a v-for="s in t.nav.sections" :key="s.id" :href="`#${s.id}`">{{ s.label }}</a>
        </nav>

        <div class="top-actions">
          <LangSwitch />
          <a v-if="showLanding" class="top-cta" href="#analise">
            <Icon name="bolt" :size="15" />
            {{ t.nav.cta }}
          </a>
        </div>
      </div>
    </header>

    <main>
      <!-- ---------- Foco da página: a análise ---------- -->
      <section
        v-if="!audit.report.value"
        id="analise"
        class="hero"
        :class="{ working: audit.running.value }"
      >
        <div class="container hero-inner">
          <span class="badge">
            <Icon name="ai" :size="14" />
            {{ t.hero.badge }}
          </span>

          <h1>
            {{ t.hero.titleLead }}
            <em>{{ t.hero.titleAccent }}</em>
          </h1>

          <p class="lead">{{ t.hero.lead }}</p>

          <form class="form" @submit.prevent="submit">
            <label class="sr-only" for="url">{{ t.hero.urlLabel }}</label>
            <div class="field">
              <Icon class="field-icon" name="link" :size="18" />
              <input
                id="url"
                v-model="url"
                type="text"
                inputmode="url"
                autocomplete="url"
                :placeholder="t.hero.placeholder"
                :disabled="audit.running.value"
                spellcheck="false"
              />
            </div>
            <button type="submit" :disabled="audit.running.value || !url.trim()">
              <Icon v-if="!audit.running.value" name="bolt" :size="17" />
              {{ audit.running.value ? t.hero.analyzing : t.hero.analyze }}
            </button>
          </form>

          <nav class="examples" :aria-label="t.hero.tryLabel">
            <span>{{ t.hero.tryLabel }}</span>
            <button
              v-for="e in EXAMPLES"
              :key="e"
              class="example"
              :disabled="audit.running.value"
              @click="useExample(e)"
            >
              {{ e }}
            </button>
          </nav>

          <ul class="highlights">
            <li v-for="h in t.hero.highlights" :key="h.label">
              <Icon :name="h.icon" :size="17" />
              <strong>{{ h.value }}</strong>
              <span>{{ h.label }}</span>
            </li>
          </ul>
        </div>

        <a v-if="showLanding" class="scroll-cue" href="#modulos">
          <span>{{ t.hero.scrollCue }}</span>
          <Icon name="arrowDown" :size="18" />
        </a>
      </section>

      <!-- ---------- Erro ---------- -->
      <div v-if="audit.error.value" class="container">
        <div class="error card" role="alert">
          <strong>{{ t.errors.auditFailed }}</strong>
          <p>{{ audit.error.value }}</p>
          <button class="retry" @click="submit">
            <Icon name="refresh" :size="15" />
            {{ t.errors.retry }}
          </button>
        </div>
      </div>

      <!-- ---------- Progresso ---------- -->
      <div v-if="audit.running.value" class="container run-area">
        <ProgressPanel
          :percent="audit.percent.value"
          :message="audit.message.value"
          :modules="audit.modules.value"
        />
      </div>

      <!-- ---------- Relatório ---------- -->
      <div v-if="audit.report.value" class="container report-area">
        <ReportView :report="audit.report.value" @new-audit="newAudit" />
      </div>

      <!-- ---------- Conteúdo institucional (aparece ao rolar) ---------- -->
      <div v-if="showLanding" class="container">
        <Landing />
      </div>
    </main>

    <footer class="foot">
      <div class="container foot-inner">
        <div class="foot-brand">
          <img src="/favicon.svg" alt="" width="22" height="22" />
          <div>
            <strong>FAST</strong>
            <p>{{ t.footer.blurb }}</p>
          </div>
        </div>

        <nav v-if="showLanding" class="foot-nav" aria-label="FAST">
          <a v-for="s in t.nav.sections" :key="s.id" :href="`#${s.id}`">{{ s.label }}</a>
          <a href="#resumo">{{ t.landing.summary.eyebrow }}</a>
        </nav>

        <p class="foot-meta">
          {{ t.footer.by }}
          <a href="https://openflexi.com/" target="_blank" rel="noopener noreferrer">OpenFlexi</a>
          · {{ t.footer.updated }} <time datetime="2026-07-29">2026-07-29</time>
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ---------- topo ---------- */

.top {
  border-bottom: 1px solid var(--border);
  background: rgba(10, 12, 16, 0.72);
  backdrop-filter: blur(14px);
  position: sticky;
  top: 0;
  z-index: 20;
}

.top-inner {
  display: flex;
  align-items: center;
  gap: 26px;
  height: 62px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 44px;
  text-decoration: none;
  color: var(--text);
  flex-shrink: 0;
}

.brand:hover {
  text-decoration: none;
}

.mark {
  display: block;
  width: 26px;
  height: 26px;
  border-radius: 7px;
}

.name {
  font-size: 19px;
  font-weight: 750;
  letter-spacing: -0.03em;
}

.tagline {
  font-size: 12.5px;
  color: var(--text-dim);
  padding-left: 11px;
  margin-left: 2px;
  border-left: 1px solid var(--border-strong);
}

.top-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.top-nav + .top-actions {
  margin-left: 0;
}

.top-nav a {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 11px;
  border-radius: var(--radius-sm);
  font-size: 13.5px;
  color: var(--text-muted);
  transition: color 0.15s, background 0.15s;
}

.top-nav a:hover {
  color: var(--text);
  background: var(--bg-hover);
  text-decoration: none;
}

.top-cta {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: var(--accent-btn);
  color: #fff;
  font-size: 13.5px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  padding: 9px 15px;
  transition: background 0.2s;
}

.top-cta:hover {
  background: var(--accent-btn-hover);
  text-decoration: none;
}

/* ---------- herói: a análise ---------- */

main {
  flex: 1;
}

.hero {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: min(760px, calc(100vh - 62px));
  padding: clamp(48px, 8vh, 96px) 0 96px;
  scroll-margin-top: 62px;
  transition: opacity 0.3s;
}

.hero.working {
  min-height: 0;
  padding-bottom: 12px;
  opacity: 0.45;
  pointer-events: none;
}

.hero-inner {
  text-align: center;
  display: grid;
  justify-items: center;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--text-muted);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 6px 14px;
  margin-bottom: 26px;
}

.badge svg {
  color: var(--accent);
}

h1 {
  font-size: clamp(31px, 5.4vw, 52px);
  line-height: 1.12;
  margin-bottom: 20px;
  max-width: 15ch;
}

h1 em {
  font-style: normal;
  background: linear-gradient(100deg, var(--accent), #9d7bff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.lead {
  font-size: 16.5px;
  line-height: 1.7;
  color: var(--text-muted);
  max-width: 62ch;
  margin: 0 auto 34px;
}

.form {
  display: flex;
  gap: 10px;
  width: 100%;
  max-width: 660px;
  margin-bottom: 16px;
}

.field {
  position: relative;
  flex: 1;
  min-width: 0;
}

.field-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-dim);
  pointer-events: none;
}

input {
  width: 100%;
  background: var(--bg-card);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  color: var(--text);
  font: inherit;
  font-size: 15.5px;
  padding: 15px 16px 15px 44px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

input::placeholder {
  color: var(--text-dim);
}

input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.form button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--accent-btn);
  color: #fff;
  border-radius: var(--radius-sm);
  padding: 15px 28px;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.2s, transform 0.1s;
}

.form button:not(:disabled):hover {
  background: var(--accent-btn-hover);
}

.form button:not(:disabled):active {
  transform: translateY(1px);
}

.examples {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 4px 6px;
  font-size: 13px;
  color: var(--text-dim);
}

.example {
  color: var(--text-muted);
  font-size: 13px;
  /* Alvo de toque >= 44px de altura (WCAG 2.5.5 / recomendação mobile). */
  min-height: 44px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
}

.example:hover:not(:disabled) {
  color: var(--accent);
  border-color: var(--border-strong);
  background: var(--bg-card);
}

.highlights {
  list-style: none;
  margin: 40px 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.highlights li {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-card);
}

.highlights svg {
  color: var(--accent);
}

.highlights strong {
  font-size: 17px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.highlights span {
  font-size: 12.5px;
  color: var(--text-dim);
}

.scroll-cue {
  position: absolute;
  left: 50%;
  bottom: 26px;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--text-dim);
  padding: 8px 14px;
  border-radius: 20px;
  transition: color 0.2s, background 0.2s;
}

.scroll-cue svg {
  animation: nudge 1.9s ease-in-out infinite;
}

.scroll-cue:hover {
  color: var(--text);
  background: var(--bg-card);
  text-decoration: none;
}

@keyframes nudge {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(4px); }
}

/* ---------- áreas de execução ---------- */

.run-area,
.report-area {
  padding-top: 8px;
  padding-bottom: 72px;
}

.error {
  border-color: rgba(255, 93, 93, 0.35);
  background: rgba(255, 93, 93, 0.06);
  margin-bottom: 22px;
}

.error strong {
  display: block;
  color: var(--bad);
  margin-bottom: 6px;
}

.error p {
  color: var(--text-muted);
  font-size: 14px;
}

.retry {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  padding: 8px 14px;
  font-size: 13.5px;
  color: var(--text-muted);
}

.retry:hover {
  background: var(--bg-hover);
  color: var(--text);
}

/* ---------- rodapé ---------- */

.foot {
  border-top: 1px solid var(--border);
  padding: 34px 0;
  margin-top: 96px;
  background: rgba(18, 21, 28, 0.4);
}

.foot-inner {
  display: grid;
  gap: 22px;
}

.foot-brand {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  max-width: 620px;
}

.foot-brand img {
  border-radius: 6px;
  margin-top: 2px;
}

.foot-brand strong {
  font-size: 15px;
  letter-spacing: -0.02em;
}

.foot-brand p {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.65;
  color: var(--text-dim);
}

.foot-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
}

.foot-nav a {
  font-size: 13px;
  color: var(--text-muted);
  min-height: 30px;
  display: inline-flex;
  align-items: center;
}

.foot-meta {
  margin: 0;
  font-size: 12.5px;
  color: var(--text-dim);
  border-top: 1px solid var(--border);
  padding-top: 18px;
}

@media (max-width: 1080px) {
  .top-nav {
    display: none;
  }
}

@media (max-width: 520px) {
  .top-cta {
    display: none;
  }
}

@media (max-width: 640px) {
  .tagline {
    display: none;
  }

  .hero {
    min-height: 0;
    padding: 40px 0 72px;
  }

  .form {
    flex-direction: column;
  }

  .form button {
    justify-content: center;
  }

  .highlights {
    margin-top: 30px;
  }

  .highlights li {
    flex: 1 1 calc(50% - 12px);
  }

  .scroll-cue {
    position: static;
    transform: none;
    margin: 34px auto 0;
    justify-content: center;
  }

  .foot {
    margin-top: 64px;
  }
}
</style>
