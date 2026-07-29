import type { Messages } from './messages';

export const pt: Messages = {
  langName: 'Português',
  htmlLang: 'pt-BR',

  meta: {
    title: 'FAST — Auditoria completa de sites: performance, SEO, GEO, LGPD e IA',
    description: 'Audite qualquer site em segundos: performance, SEO, GEO para IAs, acessibilidade e segurança, com plano de ação priorizado. Sem cadastro.',
  },

  nav: {
    tagline: 'Auditoria web completa',
    cta: 'Analisar site',
    language: 'Idioma',
    sections: [
      { id: 'modulos', label: 'O que analisamos' },
      { id: 'como-funciona', label: 'Como funciona' },
      { id: 'diferencial', label: 'Comparação' },
      { id: 'glossario', label: 'Glossário' },
      { id: 'faq', label: 'Perguntas frequentes' },
    ],
  },

  hero: {
    badge: 'Performance, SEO, segurança e GEO na mesma análise',
    titleLead: 'Descubra o que está travando o seu site —',
    titleAccent: 'inclusive para as IAs',
    lead: 'Informe o endereço e receba em segundos um diagnóstico completo: Core Web Vitals, SEO técnico, acessibilidade, segurança, infraestrutura e GEO — a otimização para ChatGPT, Claude, Gemini e Perplexity que o PageSpeed não cobre.',
    urlLabel: 'Endereço do site',
    placeholder: 'https://seusite.com.br',
    analyze: 'Analisar',
    analyzing: 'Analisando…',
    tryLabel: 'Experimente:',
    scrollCue: 'Ver o que a FAST analisa',
    highlights: [
      { icon: 'layers', value: '11', label: 'módulos de auditoria' },
      { icon: 'check', value: '167', label: 'verificações por análise' },
      { icon: 'clock', value: '~50s', label: 'para o relatório completo' },
      { icon: 'shield', value: '0', label: 'dado armazenado' },
    ],
  },

  landing: {
    modules: {
      eyebrow: 'Cobertura',
      title: 'Onze módulos, 167 verificações, uma nota por dimensão',
      intro:
        'Uma auditoria da FAST percorre onze dimensões de qualidade e devolve, para cada uma, uma nota de 0 a 100, a lista de problemas encontrados, a gravidade de cada um, como corrigir e o ganho esperado. A análise vai além da velocidade: mede também como o site é lido por mecanismos de inteligência artificial e o quanto ele está exposto a ataques — dois pontos que a maioria das ferramentas ignora, mas que hoje definem visibilidade e disponibilidade.',
      checksLabel: 'verificações',
      items: [
        {
          name: 'Performance',
          checks: 24,
          desc: 'Core Web Vitals (LCP, CLS, INP, FCP, TTFB), peso de imagens, JavaScript e fontes, recursos que bloqueiam a renderização, compressão e cache.',
        },
        {
          name: 'SEO técnico',
          checks: 23,
          desc: 'Title, meta description, canonical, hierarquia de headings, links quebrados e redirecionados, sitemap.xml, robots.txt e cartões sociais.',
        },
        {
          name: 'GEO',
          checks: 18,
          desc: 'llms.txt, permissões dos rastreadores de IA, estrutura semântica, sinais de autoridade e dados estruturados Schema.org.',
        },
        {
          name: 'Conteúdo',
          checks: 10,
          desc: 'Clareza, profundidade, legibilidade, redundância, escaneabilidade e sinais de conteúdo raso.',
        },
        {
          name: 'Acessibilidade',
          checks: 11,
          desc: 'Contraste de cores, textos alternativos, rótulos de formulário, navegação por teclado e marcos semânticos.',
        },
        {
          name: 'Segurança',
          checks: 14,
          desc: 'HTTPS, validade e cadeia do certificado, HSTS, Content-Security-Policy, cookies e conteúdo misto.',
        },
        {
          name: 'Proteção & Exposição',
          checks: 11,
          desc: 'WAF, exposição do IP de origem, chaves e senhas no código servido, stack traces, erros de banco e política de divulgação.',
        },
        {
          name: 'LGPD',
          checks: 13,
          desc: 'Consentimento antes do rastreamento, cookies gravados sem autorização, política de privacidade, encarregado (DPO) e formulários que coletam dado pessoal.',
        },
        {
          name: 'Infraestrutura',
          checks: 15,
          desc: 'HTTP/2 e HTTP/3, compressão Brotli e Gzip, política de cache, CDN, resolução de DNS, IPv6 e cadeia de redirecionamentos.',
        },
        {
          name: 'Mobile',
          checks: 8,
          desc: 'Viewport, quebras de layout, tamanho de fonte, alvos de toque, imagens responsivas e estabilidade visual no celular.',
        },
        {
          name: 'UX',
          checks: 13,
          desc: 'Navegação, hierarquia visual, consistência tipográfica, clareza das chamadas para ação, formulários e tempo até a interatividade.',
        },
      ],
    },

    steps: {
      eyebrow: 'Como funciona',
      title: 'Da URL ao plano de ação em quatro etapas',
      intro:
        'Todo o processo é automático e leva menos de um minuto. Você acompanha cada módulo terminar, em tempo real, enquanto a análise acontece.',
      figure:
        'O caminho de uma auditoria: uma única coleta alimenta os onze módulos, e o relatório consolidado é interpretado por IA antes de chegar até você.',
      flow: ['URL', 'Coleta em navegador real', '11 módulos em paralelo', 'Notas e problemas', 'Plano de ação por IA'],
      items: [
        {
          title: 'Você informa a URL',
          desc: 'Sem cadastro, sem instalar nada e sem tocar no código do site — a análise é externa, feita do jeito que um visitante (ou um robô de busca) enxerga a página.',
        },
        {
          title: 'A página é aberta de verdade',
          desc: 'Um navegador Chromium real carrega o site em desktop e em celular e coleta, em uma única passagem, métricas de performance, rede, DOM, DNS e TLS.',
        },
        {
          title: 'Onze módulos analisam em paralelo',
          desc: 'Cada módulo aplica suas verificações sobre a mesma coleta e devolve uma nota de 0 a 100, os problemas encontrados e a evidência de cada um.',
        },
        {
          title: 'A IA monta o plano de ação',
          desc: 'Um modelo de linguagem lê o relatório inteiro e escreve o resumo executivo, a ordem de prioridade e o passo a passo da correção em linguagem clara.',
        },
      ],
    },

    comparison: {
      eyebrow: 'Comparação',
      title: 'O que a FAST vê e as ferramentas de performance não veem',
      intro:
        'Ferramentas de performance respondem “o site está rápido?”. A FAST responde também “o site é encontrado, é entendido pelas IAs e está protegido?”.',
      caption: 'Comparação entre a FAST e as ferramentas tradicionais de performance',
      colFeature: 'Verificação',
      colFast: 'FAST',
      colOthers: 'Ferramentas de performance',
      yes: 'sim',
      no: 'não',
      partial: 'parcial',
      rows: [
        { feature: 'Core Web Vitals e performance', pagespeed: true },
        { feature: 'SEO técnico (headings, canonical, sitemap, links quebrados)', pagespeed: 'partial' },
        { feature: 'GEO — llms.txt e rastreadores de IA', pagespeed: false },
        { feature: 'Cabeçalhos de segurança, TLS e cookies', pagespeed: false },
        { feature: 'Exposição: WAF, IP de origem, chaves no código', pagespeed: false },
        { feature: 'Acessibilidade e UX', pagespeed: 'partial' },
  { feature: 'LGPD: consentimento, cookies e política de privacidade', pagespeed: false },
        { feature: 'Plano de ação priorizado por IA', pagespeed: false },
        { feature: 'Exportação em PDF e em JSON para IA', pagespeed: false },
      ],
    },

    glossary: {
      eyebrow: 'Definições',
      title: 'Os termos que aparecem no relatório',
      intro:
        'Todo problema apontado pela FAST vem explicado no próprio relatório. Este glossário reúne os conceitos que mais se repetem.',
      terms: [
        {
          term: 'GEO (Generative Engine Optimization)',
          def: 'GEO é a otimização de um site para mecanismos generativos — ChatGPT, Claude, Gemini, Perplexity e Copilot. Enquanto o SEO disputa uma posição na lista de resultados, o GEO disputa ser a fonte citada dentro da resposta pronta que o usuário lê.',
        },
        {
          term: 'llms.txt',
          def: 'O llms.txt é um arquivo em Markdown publicado na raiz do domínio que apresenta o site aos modelos de linguagem: o que ele é, quais páginas importam e como interpretá-las. Funciona para a IA como o robots.txt funciona para o buscador — por exemplo, o da FAST fica em /llms.txt.',
        },
        {
          term: 'Core Web Vitals',
          def: 'Core Web Vitals são as três métricas com que o Google mede a experiência real de carregamento: LCP (quando o maior elemento aparece), CLS (o quanto o layout salta) e INP (o tempo de resposta à interação).',
        },
        {
          term: 'CSP (Content-Security-Policy)',
          def: 'A CSP é um cabeçalho HTTP que declara de quais origens a página pode carregar scripts, estilos e imagens. Consiste na principal defesa contra XSS: um script injetado que não venha de uma origem declarada simplesmente não executa.',
        },
        {
          term: 'HSTS',
          def: 'HSTS significa HTTP Strict Transport Security. É o cabeçalho que instrui o navegador a só falar com o domínio por HTTPS, sem esperar o redirecionamento — o que fecha a janela de interceptação da primeira visita.',
        },
        {
          term: 'Schema.org',
          def: 'Schema.org refere-se ao vocabulário de dados estruturados que descreve o significado do conteúdo em JSON-LD. É o que permite a um buscador entender que um trecho é uma pergunta frequente, um produto ou uma organização, e não apenas texto.',
        },
      ],
    },

    faq: {
      eyebrow: 'Perguntas frequentes',
      title: 'Dúvidas comuns sobre a auditoria',
      items: [
        {
          q: 'A FAST substitui o Google PageSpeed?',
          a: 'A FAST cobre performance como o PageSpeed e vai além: avalia SEO técnico, GEO (otimização para IA), acessibilidade, segurança, proteção contra ataques e UX, explicando cada problema com prioridade, tempo estimado e ganho esperado.',
        },
        {
          q: 'A FAST guarda os resultados das auditorias?',
          a: 'Não. Não há cadastro nem banco de dados. O relatório existe apenas durante a execução e é descartado ao final — se você recarregar a página, ele desaparece. Por isso a exportação em PDF e em JSON fica à mão no topo do relatório.',
        },
        {
          q: 'O que é o módulo GEO?',
          a: 'GEO é a otimização para mecanismos de IA como ChatGPT, Claude, Gemini e Perplexity. A FAST valida llms.txt, permissões de rastreadores de IA, dados estruturados e sinais de autoridade.',
        },
        {
          q: 'A FAST realiza testes de invasão?',
          a: 'Não. A avaliação de segurança e proteção é estritamente passiva: analisa apenas o que o site já devolve ao ser visitado, sem enviar nenhum payload de ataque. É seguro apontá-la para um site em produção.',
        },
        {
          q: 'A FAST faz auditoria de LGPD?',
          a: 'A FAST verifica o que é observável de fora: se rastreadores e cookies disparam antes do consentimento, se há banner com opção de recusa, se a política de privacidade existe e cita a LGPD, se o encarregado (DPO) está identificado e se os formulários avisam sobre o uso dos dados. Não substitui parecer jurídico: base legal, registro das operações e contratos com operadores não são visíveis pelo navegador.',
        },
        {
          q: 'Quanto tempo leva uma auditoria?',
          a: 'Entre 30 e 60 segundos na maioria dos sites. O carregamento da página em navegador real é a etapa mais demorada; os onze módulos rodam em paralelo sobre a mesma coleta, e a interpretação por IA acontece ao final.',
        },
        {
          q: 'Preciso instalar algo ou mexer no código do site?',
          a: 'Não. A análise é externa e enxerga o site como qualquer visitante: basta a URL pública. Nenhum script, tag ou permissão precisa ser adicionado ao site analisado.',
        },
        {
          q: 'Posso analisar um site em homologação ou atrás de senha?',
          a: 'Só se a URL for acessível publicamente. Ambientes protegidos por login, VPN ou lista de IPs não são alcançados pela análise, porque a coleta parte de fora, sem credenciais.',
        },
        {
          q: 'Como uso o relatório dentro de uma IA?',
          a: 'Exporte em JSON: o arquivo já sai com um cabeçalho de instruções e um glossário dos campos. Cole esse arquivo em um chat de IA e peça o detalhamento das correções — por exemplo, o trecho de configuração do nginx para os cabeçalhos que faltam.',
        },
      ],
    },

    summary: {
      eyebrow: 'Em resumo',
      title: 'O essencial em cinco linhas',
      cta: 'Analisar um site agora',
      points: [
        'A FAST audita qualquer site público em menos de um minuto, sem cadastro e sem instalar nada.',
        'São 167 verificações distribuídas em onze módulos, de Core Web Vitals a conformidade com a LGPD.',
        'Cada problema vem com gravidade, tempo estimado de correção e ganho esperado.',
        'Uma IA interpreta o relatório e entrega o plano de ação já priorizado.',
        'Nada é armazenado: o relatório vive na sua tela e você o leva em PDF ou JSON.',
      ],
    },

    refs: {
      eyebrow: 'Referências',
      title: 'Padrões que a FAST aplica',
      intro: 'As verificações seguem especificações públicas — consulte a fonte de cada uma:',
      items: [
        { label: 'Core Web Vitals — web.dev', url: 'https://web.dev/articles/vitals' },
        { label: 'Especificação do llms.txt', url: 'https://llmstxt.org/' },
        { label: 'Vocabulário Schema.org', url: 'https://schema.org/' },
        { label: 'WCAG 2.2 — W3C', url: 'https://www.w3.org/WAI/WCAG22/quickref/' },
        { label: 'Content-Security-Policy — MDN', url: 'https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Guides/CSP' },
        { label: 'RFC 9116 — security.txt', url: 'https://www.rfc-editor.org/info/rfc9116/' },
        { label: 'Protocolo de sitemaps', url: 'https://www.sitemaps.org/protocol.html' },
      ],
    },
  },

  progress: {
    title: 'Auditoria em andamento',
    starting: 'Iniciando…',
    done: 'concluído',
    failed: 'falhou',
    running: 'analisando…',
    queued: 'na fila',
  },

  report: {
    back: '← Analisar outro site',
    aiButton: 'Análise IA',
    overall: 'Nota geral',
    analyzedAt: 'Analisado em',
    runtime: 'de execução',
    stats: {
      issues: 'problemas',
      critical: 'críticos',
      high: 'altos',
      aiScore: 'IA Score',
      fixTime: 'de correção',
    },
    exportPdf: 'Exportar PDF',
    exportingPdf: 'Gerando PDF…',
    exportJson: 'Exportar JSON',
    pdfError: 'Não foi possível gerar o PDF. Tente novamente.',
    noIssues: 'Sem problemas',
    issuesCount: 'problema(s)',
    issuesTitle: 'Problemas encontrados',
    filterCategory: 'Filtrar por categoria',
    filterSeverity: 'Filtrar por gravidade',
    allCategories: 'Todas as categorias',
    allSeverities: 'Todas as gravidades',
    emptyFiltered: 'Nenhum problema com os filtros selecionados.',
    modulesTitle: 'Detalhamento por módulo',
    modulesIntro: 'Todas as verificações executadas, com o valor medido em cada uma.',
    checklistTitle: 'Checklist de correções',
    checklistProgress: 'concluído(s) — o progresso é local e não é salvo em servidor.',
    moduleFailed: 'Módulo falhou:',
    recommendations: 'Recomendações',
    checksCaption: 'Verificações do módulo',
  },

  issue: {
    howToFix: 'Como corrigir',
    expectedGain: 'Ganho esperado',
    impact: 'Impacto',
    difficulty: 'Dificuldade',
    estimatedTime: 'Tempo estimado',
    evidence: 'Evidências',
  },

  plan: { title: 'Plano de ação', steps: 'etapas' },

  jsonExport: {
    format: 'Relatório de auditoria web FAST',
    instructions:
      'Este é o relatório completo de uma auditoria automatizada do site abaixo. ' +
      'Cada módulo tem nota de 0 a 100, verificações (checks) com o valor medido, e problemas ' +
      '(issues) com gravidade, impacto, dificuldade, tempo estimado de correção, como corrigir ' +
      '(howToFix), ganho esperado (expectedGain) e evidências. O campo "ai" traz uma análise em ' +
      'linguagem natural. Use estes dados para explicar os problemas, priorizar e detalhar as ' +
      'correções. Não invente métricas que não estejam aqui.',
    glossary: {
      overallScore: 'Nota geral de 0 a 100.',
      categories: 'Nota, peso e nº de problemas por categoria.',
      plugins: 'Cada módulo de auditoria: checks (verificações), issues (problemas) e evidence (evidências brutas).',
      issues: 'Lista consolidada de problemas, ordenada por prioridade.',
      ai: 'Interpretação por IA: resumo, prioridades, impactos, ganhos e plano de ação.',
      checklist: 'Itens de correção derivados dos problemas.',
      summary: 'Contagem de problemas por gravidade e tempo total estimado.',
    },
  },

  ai: {
    badge: 'Análise por IA',
    open: 'Abrir análise',
    title: 'Análise por IA',
    subtitle: 'Interpretação do relatório técnico',
    close: 'Fechar',
    executive: 'Resumo executivo',
    mainProblems: 'Principais problemas',
    priorities: 'Ordem de prioridade',
    impacts: 'Impacto no negócio',
    gains: 'Ganhos estimados',
    notes: 'Notas técnicas',
    foot: 'Gerado por IA a partir dos dados da auditoria. O plano de ação detalhado está na página.',
    unavailable: 'Análise por IA indisponível.',
    unavailableHint:
      'A auditoria técnica foi concluída normalmente — apenas a interpretação em linguagem natural não foi gerada.',
  },

  labels: {
    severity: {
      critical: 'Crítico',
      high: 'Alto',
      medium: 'Médio',
      low: 'Baixo',
      info: 'Informativo',
    },
    priority: {
      alta: 'Prioridade alta',
      media: 'Prioridade média',
      baixa: 'Prioridade baixa',
    },
    impact: { alto: 'Alto', medio: 'Médio', baixo: 'Baixo' },
    difficulty: { facil: 'Fácil', media: 'Média', dificil: 'Difícil' },
    score: {
      excellent: 'Excelente',
      good: 'Bom',
      fair: 'Precisa melhorar',
      poor: 'Crítico',
    },
    minutes: 'min',
    hours: 'h',
    workdays: 'dia(s) de trabalho',
  },

  errors: {
    auditFailed: 'Não foi possível concluir a auditoria',
    retry: 'Tentar novamente',
    connectionLost: 'A conexão com o servidor foi interrompida. Tente novamente.',
  },

  footer: {
    blurb:
      'Auditoria executada sob demanda, sem autenticação e sem persistência. Nenhum resultado é armazenado após o encerramento da análise.',
    by: 'Por',
    updated: 'atualizado em',
  },
};
