# Especificação Funcional — Plataforma de Auditoria Web (SEO + GEO + Performance + IA)

## Objetivo

Desenvolver uma plataforma online que realize uma auditoria completa de qualquer website, gerando um relatório técnico e visual sobre performance, SEO, GEO (Generative Engine Optimization), acessibilidade, segurança, infraestrutura e qualidade do conteúdo.

A análise será executada sob demanda, sem necessidade de autenticação e sem persistência em banco de dados. O resultado existe apenas durante a execução da análise e é descartado ao final.

O objetivo é criar uma ferramenta mais completa que o Google PageSpeed, cobrindo também aspectos importantes para mecanismos de IA (ChatGPT, Claude, Gemini, Perplexity, Copilot e outros).

---

# Arquitetura

## Frontend

* Vue 3
* TypeScript
* Interface moderna
* Responsiva
* Tema escuro
* Atualização em tempo real durante a análise

## Backend

* Node.js
* Fastify
* Chromium Headless
* Playwright ou Chrome DevTools Protocol
* Execução assíncrona
* Sem banco de dados
* Sem armazenamento permanente

---

# Fluxo

```text
Usuário informa uma URL

↓

Validação da URL

↓

Início da auditoria

↓

Execução paralela dos módulos

↓

Consolidação dos resultados

↓

Geração da pontuação

↓

Exibição do relatório

↓

Resultado descartado
```

---

# Dashboard Final

Cada categoria recebe uma nota de 0 a 100.

Exemplo:

```text
Performance         96

SEO                 94

GEO                 91

Conteúdo            88

Segurança           100

Acessibilidade      90

Infraestrutura      95

UX                  89

Nota Geral          93
```

Cada categoria possui:

* Nota
* Problemas encontrados
* Gravidade
* Explicação
* Como corrigir
* Ganho esperado

---

# Módulo 1 — Performance

## Core Web Vitals

Analisar:

* LCP
* CLS
* INP
* FCP
* TTFB
* Speed Index
* Total Blocking Time

## Recursos

Analisar:

* imagens
* JavaScript
* CSS
* fontes
* vídeos
* SVG

## Carregamento

Verificar:

* lazy loading
* preload
* prefetch
* render blocking
* critical CSS
* bundle size
* tree shaking

## Rede

Verificar:

* número de requisições
* tamanho transferido
* compressão
* Brotli
* Gzip
* cache

---

# Módulo 2 — SEO Tradicional

## HTML

Verificar:

* title
* meta description
* canonical
* robots
* viewport
* charset

## Estrutura

Verificar:

* H1
* H2
* H3
* headings duplicados
* headings ausentes

## Links

Verificar:

* internos
* externos
* quebrados
* redirects

## Sitemap

Verificar:

* sitemap.xml
* sitemap index
* URLs inválidas

## Robots

Verificar:

* robots.txt
* regras incorretas
* páginas bloqueadas

## Open Graph

Verificar:

* og:title
* og:image
* og:url
* og:type

## Twitter

Verificar:

* twitter:card
* twitter:title
* twitter:image

---

# Módulo 3 — GEO (Generative Engine Optimization)

## llms.txt

Verificar:

* existência
* HTTP 200
* encoding
* tamanho
* estrutura
* links internos
* conteúdo

## llms-full.txt

Verificar:

* existência
* estrutura
* validade

## Robots para IA

Verificar regras para:

* GPTBot
* ClaudeBot
* Google-Extended
* CCBot
* PerplexityBot
* Applebot
* Bingbot
* Amazonbot
* Bytespider
* OAI-SearchBot
* outros rastreadores relevantes

Detectar bloqueios indevidos.

## Conteúdo amigável para IA

Avaliar:

* definições claras
* FAQs
* listas
* tabelas
* passo a passo
* exemplos
* resumos
* linguagem objetiva

## Autoridade

Verificar:

* autor
* data publicação
* data atualização
* referências
* fontes

## Estrutura semântica

Verificar:

* article
* main
* nav
* section
* aside
* figure
* figcaption
* header
* footer
* time

## Schema.org

Validar:

* Organization
* Product
* LocalBusiness
* FAQ
* Article
* Review
* Person
* Breadcrumb
* VideoObject
* Event
* Service
* SoftwareApplication

## IA Score

Gerar nota específica para consumo por LLMs.

---

# Módulo 4 — Conteúdo

Avaliar automaticamente:

* clareza
* profundidade
* redundância
* excesso de palavras-chave
* legibilidade
* tamanho
* escaneabilidade
* organização
* linguagem

Detectar:

* conteúdo raso
* conteúdo duplicado
* excesso de propaganda
* ausência de contexto

---

# Módulo 5 — Acessibilidade

Validar:

* contraste
* aria-label
* labels
* tabindex
* foco
* teclado
* leitores de tela
* ordem lógica
* alt das imagens

---

# Módulo 6 — Segurança

Verificar:

* HTTPS
* certificado
* HSTS
* CSP
* X-Frame-Options
* Referrer-Policy
* Permissions-Policy
* X-Content-Type-Options
* cookies Secure
* cookies HttpOnly
* SameSite
* Mixed Content

---

# Módulo 7 — Infraestrutura

Verificar:

* HTTP/2
* HTTP/3
* Brotli
* Gzip
* Keep Alive
* Cache-Control
* ETag
* CDN
* DNS
* IPv6
* redirects

---

# Módulo 8 — Mobile

Avaliar:

* viewport
* responsividade
* tamanho das fontes
* tamanho dos botões
* espaçamento
* CLS em mobile
* imagens responsivas

---

# Módulo 9 — UX

Verificar:

* consistência visual
* navegação
* hierarquia visual
* CTA
* menus
* formulários
* tempo até interação
* elementos clicáveis

---

# Módulo 10 — Inteligência Artificial

Após concluir toda a análise técnica, um agente de IA deverá interpretar os resultados e produzir uma avaliação em linguagem natural.

A IA deverá:

* resumir os principais problemas
* explicar impactos
* priorizar correções
* estimar ganhos
* sugerir melhorias
* explicar tecnicamente cada recomendação
* gerar um plano de ação

---

# Sistema de Priorização

Cada problema deverá possuir:

* categoria
* gravidade
* impacto
* dificuldade
* tempo estimado
* prioridade

Exemplo:

```text
Problema:
Imagem de 3,4 MB

Impacto:
Alto

Prioridade:
Alta

Tempo estimado:
15 minutos

Ganho esperado:
Redução aproximada de 1,2 s no carregamento.
```

---

# Relatório Final

O relatório deverá conter:

* resumo executivo
* nota geral
* notas por categoria
* gráficos
* problemas encontrados
* recomendações
* plano de ação
* checklist de correções

---

# Diferenciais

A plataforma deverá ser superior ao Google PageSpeed por incluir:

* análise completa de GEO
* validação de llms.txt
* validação de llms-full.txt
* auditoria para LLMs
* avaliação de conteúdo
* IA explicando cada problema
* plano automático de otimização
* priorização inteligente
* explicações acessíveis para usuários não técnicos

---

# Requisitos Não Funcionais

* Sem login
* Sem cadastro
* Sem banco de dados
* Sem persistência dos resultados
* Execução totalmente local no servidor
* Interface extremamente rápida
* Execução paralela das auditorias
* API REST
* Código modular
* Arquitetura orientada a plugins para facilitar a adição de novos módulos de análise

---

# Arquitetura de Plugins

Cada auditoria deverá ser implementada como um plugin independente.

Exemplo:

```text
core/
    engine/

plugins/
    performance/
    seo/
    geo/
    accessibility/
    security/
    infrastructure/
    ux/
    content/
    ai/

report/

frontend/
```

Cada plugin deverá expor uma interface padronizada:

* nome
* descrição
* categoria
* lista de verificações
* pontuação
* problemas encontrados
* recomendações
* evidências
* tempo de execução

Isso permitirá adicionar, remover ou atualizar auditorias sem alterar o núcleo da aplicação, tornando a plataforma extensível e preparada para acompanhar a evolução dos padrões web, SEO e otimização para mecanismos de IA.
