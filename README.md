# FAST

Plataforma de auditoria web que analisa qualquer site sob demanda e devolve um
relatório técnico e visual sobre **performance, SEO, GEO, conteúdo, acessibilidade,
segurança, infraestrutura, mobile e UX** — com interpretação e plano de ação
gerados por IA.

O diferencial em relação ao Google PageSpeed é o módulo **GEO (Generative Engine
Optimization)**: validação de `llms.txt` e `llms-full.txt`, permissões de
rastreadores de IA (GPTBot, ClaudeBot, Google-Extended, PerplexityBot e outros),
estrutura semântica, sinais de autoridade e dados estruturados — tudo o que
determina se o site é citado corretamente por ChatGPT, Claude, Gemini e Perplexity.

**Sem login. Sem cadastro. Sem banco de dados.** O resultado existe apenas durante
a execução da análise e é descartado ao final.

---

## Instalação

Em um servidor Debian/Ubuntu com o DNS de `fast.openflexi.com` já apontando para ele:

```bash
sudo make install
```

Um único comando cuida de tudo: dependências de sistema (Node.js, nginx, certbot),
dependências do projeto, Chromium do Playwright, build do backend e do frontend,
configuração do nginx, certificado TLS via Let's Encrypt com renovação automática,
e o serviço systemd habilitado no boot.

Ao final, o site está no ar em `https://fast.openflexi.com`.

### Atualização

```bash
sudo make update
```

Baixa as alterações do repositório, reinstala dependências, reconstrói, reaplica
nginx e systemd, e reinicia o serviço. Idempotente — pode rodar quantas vezes quiser.

### Habilitando a análise por IA

O Módulo 10 usa a API da Anthropic. Sem chave, a auditoria técnica roda normalmente
e apenas a interpretação em linguagem natural é omitida.

```bash
sudo nano .env          # defina ANTHROPIC_API_KEY
sudo make restart
```

---

## Comandos

| Comando | O que faz |
| --- | --- |
| `sudo make install` | Instalação completa |
| `sudo make update` | Atualiza e reinicia |
| `make dev` | Backend + frontend em modo de desenvolvimento |
| `make build` | Compila backend e frontend |
| `make doctor` | Diagnóstico do ambiente (Node, build, Chromium, serviço, nginx, TLS, DNS) |
| `make logs` | Logs em tempo real |
| `make status` / `start` / `stop` / `restart` | Controle do serviço |
| `sudo make ssl` | Emite ou renova o certificado |
| `sudo make nginx` | Reaplica a configuração do nginx |
| `sudo make uninstall` | Remove serviço e configuração do nginx (preserva arquivos e certificado) |

`make` sem argumentos exibe a ajuda.

---

## Desenvolvimento local

```bash
make dev
```

Backend em `http://127.0.0.1:3001`, frontend em `http://localhost:5173` com proxy
para a API. Em macOS use apenas `make dev` — `install`/`update` são específicos de Linux.

---

## Arquitetura

```
core/
    engine.ts      orquestração e execução paralela
    collector.ts   coleta única (Chromium desktop + mobile, rede, DNS, TLS)
    extract.ts     extração do DOM dentro do navegador
    registry.ts    registro de plugins
    scoring.ts     notas, prioridades e consolidação

plugins/
    performance/   Core Web Vitals, recursos, carregamento, rede
    seo/           HTML, headings, links, sitemap, robots, Open Graph
    geo/           llms.txt, rastreadores de IA, semântica, Schema.org, IA Score
    content/       clareza, legibilidade, redundância, propaganda
    accessibility/ contraste, alt, rótulos, teclado, marcos
    security/      HTTPS, certificado, cabeçalhos, cookies, mixed content
    infrastructure/HTTP/2-3, compressão, cache, CDN, DNS, IPv6
    mobile/        viewport, responsividade, fontes, alvos de toque
    ux/            consistência, navegação, CTAs, formulários
    ai/            Módulo 10 — interpretação em linguagem natural

routes/            API REST + streaming SSE
frontend/          Vue 3 + TypeScript, tema escuro, progresso em tempo real
```

### Fluxo

```
URL → validação → coleta única → execução paralela dos 9 módulos
    → consolidação e pontuação → análise por IA → relatório → descarte
```

O navegador é aberto **uma vez por auditoria** (desktop e mobile) e todos os
módulos consomem o mesmo contexto coletado. Isso mantém uma auditoria completa
em torno de 15 segundos.

### Arquitetura de plugins

Cada auditoria é um plugin independente que expõe a mesma interface:

```ts
interface AuditPlugin {
  id: string;
  name: string;
  description: string;
  category: CategoryId;
  checks: string[];      // verificações declaradas
  weight: number;        // peso na nota geral
  run(ctx: AuditContext): Promise<PluginOutput>;
}
```

Para adicionar um módulo novo: crie a pasta em `backend/src/plugins/`, exporte um
`AuditPlugin` e registre-o em `plugins/index.ts`. Nada no núcleo precisa mudar.

### Sistema de priorização

Cada problema declara gravidade, impacto, dificuldade e tempo estimado. O núcleo
calcula a prioridade combinando os três — correções fáceis de alto impacto sobem
na lista — e ordena o relatório e o checklist por ela.

---

## API

| Rota | Descrição |
| --- | --- |
| `GET /api/health` | Estado do serviço |
| `GET /api/modules` | Módulos registrados e suas verificações |
| `GET /api/audit?url=...` | Auditoria completa (JSON, resposta única) |
| `GET /api/audit/stream?url=...` | Auditoria com progresso em tempo real (SSE) |

```bash
curl "https://fast.openflexi.com/api/audit?url=https://exemplo.com" | jq .overallScore
```

---

## Configuração

Todas as opções ficam em `.env` (criado a partir de `.env.example` no `make install`):

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `FAST_DOMAIN` | `fast.openflexi.com` | Domínio público |
| `FAST_SSL_EMAIL` | — | E-mail do Let's Encrypt |
| `PORT` / `HOST` | `3001` / `127.0.0.1` | Bind do backend |
| `ANTHROPIC_API_KEY` | — | Habilita o Módulo 10 |
| `FAST_AI_MODEL` | `claude-opus-5` | Modelo usado na análise |
| `FAST_AI_EFFORT` | `medium` | Profundidade do raciocínio |
| `FAST_AUDIT_TIMEOUT` | `120000` | Tempo máximo por auditoria (ms) |
| `FAST_MAX_CONCURRENCY` | `2` | Auditorias simultâneas |
| `FAST_RATE_LIMIT` | `10` | Requisições por minuto por IP |

`FAST_MAX_CONCURRENCY` é o parâmetro que mais pesa em memória: cada auditoria
mantém um Chromium com dois contextos. Em uma VPS de 2 GB, mantenha em 1 ou 2.

---

## Notas operacionais

- **SSE atrás do nginx**: a rota de streaming roda com `proxy_buffering off` e
  `gzip off`. Sem isso os eventos chegam todos de uma vez no fim.
- **Endereços internos são bloqueados** (localhost, faixas privadas, link-local)
  para evitar SSRF.
- **O serviço roda como usuário `fast`** com `ProtectSystem`, `PrivateTmp` e limite
  de memória. O sandbox do Chromium exige namespaces, então `NoNewPrivileges` fica
  desligado deliberadamente.
- **Renovação do certificado** é automática via timer do systemd, com `reload` do
  nginx no deploy hook.
