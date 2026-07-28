<script setup lang="ts">
import { ref } from 'vue';
import ProgressPanel from './components/ProgressPanel.vue';
import ReportView from './components/ReportView.vue';
import { useAudit } from '@/composables/useAudit';

const url = ref('');
const audit = useAudit();

const EXAMPLES = ['vuejs.org', 'wikipedia.org', 'github.com'];

const DIMENSIONS = [
  { name: 'Performance', desc: 'Core Web Vitals, peso de recursos e estratégia de carregamento.' },
  { name: 'SEO', desc: 'Title, meta tags, headings, links, sitemap, robots e cartões sociais.' },
  { name: 'GEO', desc: 'llms.txt, permissões de rastreadores de IA, semântica e Schema.org.' },
  { name: 'Conteúdo', desc: 'Clareza, profundidade, legibilidade e escaneabilidade.' },
  { name: 'Acessibilidade', desc: 'Contraste, alt, rótulos, teclado e marcos semânticos.' },
  { name: 'Segurança', desc: 'HTTPS, certificado, cabeçalhos, cookies e conteúdo misto.' },
  { name: 'Proteção', desc: 'WAF, exposição de IP, chaves e senhas e sinais de SQL injection.' },
  { name: 'Infraestrutura', desc: 'HTTP/2 e 3, compressão, cache, CDN, DNS e IPv6.' },
  { name: 'Mobile', desc: 'Viewport, responsividade, fontes e alvos de toque.' },
  { name: 'UX', desc: 'Navegação, hierarquia visual, CTAs e formulários.' },
];

const FAQ = [
  {
    q: 'A FAST substitui o Google PageSpeed?',
    a: 'A FAST cobre performance como o PageSpeed e vai além: avalia SEO técnico, GEO (otimização para IA), acessibilidade, segurança, proteção contra ataques e UX, explicando cada problema com prioridade, tempo estimado e ganho esperado.',
  },
  {
    q: 'A FAST guarda os resultados das auditorias?',
    a: 'Não. Não há cadastro nem banco de dados. O relatório existe apenas durante a execução e é descartado ao final.',
  },
  {
    q: 'O que é o módulo GEO?',
    a: 'GEO é a otimização para mecanismos de IA como ChatGPT, Claude, Gemini e Perplexity. A FAST valida llms.txt, permissões de rastreadores de IA, dados estruturados e sinais de autoridade.',
  },
  {
    q: 'A FAST realiza testes de invasão?',
    a: 'Não. A avaliação de segurança e proteção é estritamente passiva: analisa apenas o que o site já devolve, sem enviar nenhum payload de ataque.',
  },
];

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

        <nav class="examples" aria-label="Sites de exemplo">
          <span>Experimente:</span>
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
      </section>

      <!-- ---------- Conteúdo institucional (SEO/GEO) ---------- -->
      <section v-if="!audit.report.value && !audit.running.value" class="learn" aria-labelledby="learn-title">
        <header class="learn-head">
          <h2 id="learn-title">O que a FAST analisa</h2>
          <p>
            Uma auditoria da FAST cobre dez dimensões de qualidade de um site, cada uma com uma nota
            de 0 a 100, os problemas encontrados, a gravidade, como corrigir e o ganho esperado. A
            análise vai além da velocidade: avalia também como o site é lido por mecanismos de
            inteligência artificial e quão exposto ele está a ataques — dois pontos que a maioria das
            ferramentas de auditoria ignora, mas que hoje definem visibilidade e disponibilidade.
          </p>
        </header>

        <ul class="dimensions">
          <li v-for="d in DIMENSIONS" :key="d.name">
            <strong>{{ d.name }}</strong>
            <span>{{ d.desc }}</span>
          </li>
        </ul>

        <article class="how">
          <h3>Como funciona</h3>
          <ol>
            <li>Você informa a URL de um site.</li>
            <li>A FAST abre a página em um navegador real (desktop e mobile) e coleta métricas de performance, rede, DOM, DNS e TLS.</li>
            <li>Dez módulos independentes analisam a coleta em paralelo e geram as notas.</li>
            <li>Uma IA interpreta o relatório e monta o resumo, a priorização e o plano de ação.</li>
          </ol>
        </article>

        <article class="faq">
          <h3>Perguntas frequentes</h3>
          <details v-for="(f, i) in FAQ" :key="i">
            <summary>{{ f.q }}</summary>
            <p>{{ f.a }}</p>
          </details>
        </article>

        <p class="learn-foot">
          Cada problema encontrado vem com prioridade, tempo estimado de correção e ganho esperado,
          para que você saiba exatamente por onde começar. Ao final, uma inteligência artificial
          interpreta todo o relatório e monta um plano de ação em linguagem clara.
        </p>
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
      <ReportView v-if="audit.report.value" :report="audit.report.value" @new-audit="newAudit" />
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
  min-height: 44px;
  text-decoration: none;
  color: var(--text);
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
  background: var(--accent-btn);
  color: #fff;
  border-radius: var(--radius-sm);
  padding: 13px 26px;
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
  margin-bottom: 22px;
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

/* ---------- conteúdo institucional ---------- */

.learn-foot {
  max-width: 680px;
  margin: 0 auto;
  text-align: center;
  font-size: 14.5px;
  line-height: 1.7;
  color: var(--text-muted);
}


.learn {
  max-width: 900px;
  margin: 8px auto 0;
  display: grid;
  gap: 34px;
}

.learn-head {
  text-align: center;
  max-width: 640px;
  margin: 0 auto;
}

.learn-head h2 {
  font-size: 24px;
  margin-bottom: 10px;
}

.learn-head p {
  color: var(--text-muted);
  font-size: 15px;
  margin: 0;
}

.dimensions {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 10px;
}

.dimensions li {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
}

.dimensions strong {
  display: block;
  font-size: 14.5px;
  margin-bottom: 3px;
}

.dimensions span {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
}

.how,
.faq {
  max-width: 680px;
  margin: 0 auto;
  width: 100%;
}

.how h3,
.faq h3 {
  font-size: 17px;
  margin-bottom: 14px;
  text-align: center;
}

.how ol {
  margin: 0;
  padding-left: 22px;
  display: grid;
  gap: 9px;
  color: var(--text-muted);
  font-size: 14.5px;
  line-height: 1.55;
}

.faq details {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  padding: 0 16px;
  margin-bottom: 9px;
}

.faq summary {
  cursor: pointer;
  padding: 14px 0;
  font-size: 14.5px;
  font-weight: 600;
  list-style: none;
}

.faq summary::-webkit-details-marker {
  display: none;
}

.faq summary::before {
  content: '+';
  display: inline-block;
  width: 18px;
  color: var(--accent);
  font-weight: 700;
}

.faq details[open] summary::before {
  content: '−';
}

.faq details p {
  margin: 0 0 16px 18px;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.6;
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
