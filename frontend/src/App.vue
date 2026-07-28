<script setup lang="ts">
import { onMounted, ref } from 'vue';
import ProgressPanel from './components/ProgressPanel.vue';
import ReportView from './components/ReportView.vue';
import { useAudit } from '@/composables/useAudit';

const url = ref('');
const aiEnabled = ref(false);
const audit = useAudit();

const EXAMPLES = ['vuejs.org', 'wikipedia.org', 'github.com'];

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

onMounted(async () => {
  try {
    const res = await fetch('/api/health');
    const data = (await res.json()) as { aiEnabled?: boolean };
    aiEnabled.value = Boolean(data.aiEnabled);
  } catch {
    // Health check é informativo; falha não bloqueia o uso.
  }
});
</script>

<template>
  <div class="app">
    <header class="top">
      <div class="container top-inner">
        <a class="brand" href="/">
          <span class="mark" aria-hidden="true">⚡</span>
          <span class="name">FAST</span>
        </a>
        <span class="tagline">Auditoria web completa — performance, SEO, GEO e IA</span>
      </div>
    </header>

    <main class="container">
      <!-- ---------- Formulário ---------- -->
      <section v-if="!audit.report.value" class="intro" :class="{ compact: audit.running.value }">
        <h1>
          Descubra o que está travando o seu site —
          <em>inclusive para as IAs</em>
        </h1>
        <p class="lead">
          Uma análise completa em segundos: Core Web Vitals, SEO técnico, acessibilidade, segurança,
          infraestrutura e GEO — a otimização para ChatGPT, Claude, Gemini e Perplexity que o
          PageSpeed não cobre.
        </p>

        <form class="form" @submit.prevent="submit">
          <label class="sr-only" for="url">Endereço do site</label>
          <input
            id="url"
            v-model="url"
            type="text"
            inputmode="url"
            autocomplete="url"
            placeholder="https://seusite.com.br"
            :disabled="audit.running.value"
            spellcheck="false"
          />
          <button type="submit" :disabled="audit.running.value || !url.trim()">
            {{ audit.running.value ? 'Analisando…' : 'Analisar' }}
          </button>
        </form>

        <p class="examples">
          Experimente:
          <button
            v-for="e in EXAMPLES"
            :key="e"
            class="example"
            :disabled="audit.running.value"
            @click="useExample(e)"
          >
            {{ e }}
          </button>
        </p>

        <ul class="badges">
          <li>Sem cadastro</li>
          <li>Sem banco de dados</li>
          <li>Resultado descartado ao final</li>
          <li v-if="aiEnabled">Análise por IA ativa</li>
        </ul>
      </section>

      <!-- ---------- Erro ---------- -->
      <div v-if="audit.error.value" class="error card" role="alert">
        <strong>Não foi possível concluir a auditoria</strong>
        <p>{{ audit.error.value }}</p>
        <button class="retry" @click="submit">Tentar novamente</button>
      </div>

      <!-- ---------- Progresso ---------- -->
      <ProgressPanel
        v-if="audit.running.value"
        :percent="audit.percent.value"
        :message="audit.message.value"
        :modules="audit.modules.value"
      />

      <!-- ---------- Relatório ---------- -->
      <template v-if="audit.report.value">
        <div class="report-actions">
          <button class="new" @click="newAudit">← Analisar outro site</button>
        </div>
        <ReportView :report="audit.report.value" />
      </template>
    </main>

    <footer class="foot">
      <div class="container">
        <p>
          FAST · auditoria executada sob demanda, sem autenticação e sem persistência. Nenhum
          resultado é armazenado após o encerramento da análise.
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
  background: rgba(10, 12, 16, 0.7);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 10;
}

.top-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 58px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 9px;
  text-decoration: none;
  color: var(--text);
}

.brand:hover {
  text-decoration: none;
}

.mark {
  font-size: 19px;
}

.name {
  font-size: 19px;
  font-weight: 750;
  letter-spacing: -0.03em;
}

.tagline {
  font-size: 13px;
  color: var(--text-dim);
}

/* ---------- intro ---------- */

main {
  flex: 1;
  padding: 56px 24px 72px;
  display: grid;
  gap: 22px;
  align-content: start;
}

.intro {
  text-align: center;
  max-width: 780px;
  margin: 0 auto 12px;
  transition: opacity 0.3s;
}

.intro.compact {
  opacity: 0.4;
  pointer-events: none;
}

h1 {
  font-size: clamp(28px, 5vw, 44px);
  line-height: 1.15;
  margin-bottom: 18px;
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
  color: var(--text-muted);
  max-width: 640px;
  margin: 0 auto 32px;
}

.form {
  display: flex;
  gap: 9px;
  max-width: 580px;
  margin: 0 auto 16px;
}

input {
  flex: 1;
  min-width: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  color: var(--text);
  font: inherit;
  padding: 13px 16px;
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
  background: var(--accent);
  color: #fff;
  border-radius: var(--radius-sm);
  padding: 13px 26px;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.2s, transform 0.1s;
}

.form button:not(:disabled):hover {
  background: #3d7cf0;
}

.form button:not(:disabled):active {
  transform: translateY(1px);
}

.examples {
  font-size: 13px;
  color: var(--text-dim);
  margin-bottom: 26px;
}

.example {
  color: var(--text-muted);
  border-bottom: 1px dashed var(--border-strong);
  margin: 0 3px;
  font-size: 13px;
}

.example:hover:not(:disabled) {
  color: var(--accent);
  border-color: var(--accent);
}

.badges {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin: 0;
  padding: 0;
}

.badges li {
  font-size: 12px;
  color: var(--text-dim);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 3px 12px;
}

/* ---------- erro ---------- */

.error {
  border-color: rgba(255, 93, 93, 0.35);
  background: rgba(255, 93, 93, 0.06);
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
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  padding: 7px 14px;
  font-size: 13.5px;
  color: var(--text-muted);
}

.retry:hover {
  background: var(--bg-hover);
  color: var(--text);
}

/* ---------- relatório ---------- */

.report-actions {
  display: flex;
}

.new {
  font-size: 14px;
  color: var(--text-muted);
}

.new:hover {
  color: var(--accent);
}

/* ---------- rodapé ---------- */

.foot {
  border-top: 1px solid var(--border);
  padding: 26px 0;
  margin-top: auto;
}

.foot p {
  margin: 0;
  font-size: 12.5px;
  color: var(--text-dim);
  text-align: center;
}

@media (max-width: 640px) {
  main {
    padding: 36px 16px 52px;
  }

  .container {
    padding: 0 16px;
  }

  .form {
    flex-direction: column;
  }

  .tagline {
    display: none;
  }
}
</style>
