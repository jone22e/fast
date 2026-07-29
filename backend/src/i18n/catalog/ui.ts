import type { Lang, UiCatalog } from '../types.js';

/**
 * Textos que não vêm dos plugins: rótulos de categoria, mensagens de progresso
 * emitidas durante a auditoria e avisos do módulo de IA.
 *
 * As mensagens de progresso são indexadas pela mensagem original em pt-BR
 * porque nascem espalhadas pelo coletor e pelo motor, sem id. É uma tradução
 * de tabela: o que não estiver na tabela passa direto, em português.
 */
export const UI: Record<Lang, UiCatalog> = {
  pt: {
    categories: {
      performance: 'Performance',
      seo: 'SEO',
      geo: 'GEO',
      content: 'Conteúdo',
      security: 'Segurança',
      protection: 'Proteção & Exposição',
      accessibility: 'Acessibilidade',
      infrastructure: 'Infraestrutura',
      mobile: 'Mobile',
      ux: 'UX',
    },
    progress: {
      'Validando URL e iniciando coleta…': 'Validando URL e iniciando coleta…',
      'Abrindo página em Chromium (desktop)…': 'Abrindo página em Chromium (desktop)…',
      'Extraindo DOM e dados estruturados…': 'Extraindo DOM e dados estruturados…',
      'Baixando HTML bruto…': 'Baixando HTML bruto…',
      'Repetindo a análise em viewport mobile…': 'Repetindo a análise em viewport mobile…',
      'Verificando robots.txt, llms.txt, security.txt, sitemap, DNS e TLS…':
        'Verificando robots.txt, llms.txt, security.txt, sitemap, DNS e TLS…',
      'Coleta concluída. Executando módulos de auditoria…':
        'Coleta concluída. Executando módulos de auditoria…',
      'Consolidando resultados e calculando notas…': 'Consolidando resultados e calculando notas…',
      'Gerando análise em linguagem natural…': 'Gerando análise em linguagem natural…',
      'Montando relatório final…': 'Montando relatório final…',
      'Auditoria concluída.': 'Auditoria concluída.',
      'Tempo limite excedido durante a coleta da página.':
        'Tempo limite excedido durante a coleta da página.',
    },
    moduleDone: '{0} concluído.',
    moduleFailed: '{0} falhou.',
    aiUnavailable: 'Análise por IA não configurada neste ambiente.',
    aiFailed: 'A análise por IA não pôde ser concluída.',
  },

  en: {
    categories: {
      performance: 'Performance',
      seo: 'SEO',
      geo: 'GEO',
      content: 'Content',
      security: 'Security',
      protection: 'Protection & Exposure',
      accessibility: 'Accessibility',
      infrastructure: 'Infrastructure',
      mobile: 'Mobile',
      ux: 'UX',
    },
    progress: {
      'Validando URL e iniciando coleta…': 'Validating the URL and starting collection…',
      'Abrindo página em Chromium (desktop)…': 'Opening the page in Chromium (desktop)…',
      'Extraindo DOM e dados estruturados…': 'Extracting the DOM and structured data…',
      'Baixando HTML bruto…': 'Downloading the raw HTML…',
      'Repetindo a análise em viewport mobile…': 'Repeating the analysis on a mobile viewport…',
      'Verificando robots.txt, llms.txt, security.txt, sitemap, DNS e TLS…':
        'Checking robots.txt, llms.txt, security.txt, sitemap, DNS and TLS…',
      'Coleta concluída. Executando módulos de auditoria…':
        'Collection finished. Running the audit modules…',
      'Consolidando resultados e calculando notas…': 'Consolidating results and computing scores…',
      'Gerando análise em linguagem natural…': 'Generating the plain-language analysis…',
      'Montando relatório final…': 'Assembling the final report…',
      'Auditoria concluída.': 'Audit complete.',
      'Tempo limite excedido durante a coleta da página.':
        'Timed out while collecting the page.',
    },
    moduleDone: '{0} finished.',
    moduleFailed: '{0} failed.',
    aiUnavailable: 'AI analysis is not configured in this environment.',
    aiFailed: 'The AI analysis could not be completed.',
  },

  es: {
    categories: {
      performance: 'Rendimiento',
      seo: 'SEO',
      geo: 'GEO',
      content: 'Contenido',
      security: 'Seguridad',
      protection: 'Protección y exposición',
      accessibility: 'Accesibilidad',
      infrastructure: 'Infraestructura',
      mobile: 'Móvil',
      ux: 'UX',
    },
    progress: {
      'Validando URL e iniciando coleta…': 'Validando la URL e iniciando la recolección…',
      'Abrindo página em Chromium (desktop)…': 'Abriendo la página en Chromium (escritorio)…',
      'Extraindo DOM e dados estruturados…': 'Extrayendo el DOM y los datos estructurados…',
      'Baixando HTML bruto…': 'Descargando el HTML sin procesar…',
      'Repetindo a análise em viewport mobile…': 'Repitiendo el análisis en viewport móvil…',
      'Verificando robots.txt, llms.txt, security.txt, sitemap, DNS e TLS…':
        'Verificando robots.txt, llms.txt, security.txt, sitemap, DNS y TLS…',
      'Coleta concluída. Executando módulos de auditoria…':
        'Recolección finalizada. Ejecutando los módulos de auditoría…',
      'Consolidando resultados e calculando notas…': 'Consolidando resultados y calculando puntuaciones…',
      'Gerando análise em linguagem natural…': 'Generando el análisis en lenguaje natural…',
      'Montando relatório final…': 'Armando el informe final…',
      'Auditoria concluída.': 'Auditoría completada.',
      'Tempo limite excedido durante a coleta da página.':
        'Se agotó el tiempo durante la recolección de la página.',
    },
    moduleDone: '{0} finalizado.',
    moduleFailed: '{0} falló.',
    aiUnavailable: 'El análisis por IA no está configurado en este entorno.',
    aiFailed: 'No se pudo completar el análisis por IA.',
  },

  zh: {
    categories: {
      performance: '性能',
      seo: 'SEO',
      geo: 'GEO',
      content: '内容',
      security: '安全',
      protection: '防护与暴露面',
      accessibility: '无障碍',
      infrastructure: '基础设施',
      mobile: '移动端',
      ux: '用户体验',
    },
    progress: {
      'Validando URL e iniciando coleta…': '正在校验网址并开始采集……',
      'Abrindo página em Chromium (desktop)…': '正在 Chromium 中打开页面（桌面端）……',
      'Extraindo DOM e dados estruturados…': '正在提取 DOM 与结构化数据……',
      'Baixando HTML bruto…': '正在下载原始 HTML……',
      'Repetindo a análise em viewport mobile…': '正在移动端视口重复分析……',
      'Verificando robots.txt, llms.txt, security.txt, sitemap, DNS e TLS…':
        '正在检查 robots.txt、llms.txt、security.txt、站点地图、DNS 与 TLS……',
      'Coleta concluída. Executando módulos de auditoria…': '采集完成，正在运行审计模块……',
      'Consolidando resultados e calculando notas…': '正在汇总结果并计算评分……',
      'Gerando análise em linguagem natural…': '正在生成自然语言分析……',
      'Montando relatório final…': '正在生成最终报告……',
      'Auditoria concluída.': '审计完成。',
      'Tempo limite excedido durante a coleta da página.': '页面采集超时。',
    },
    moduleDone: '{0} 已完成。',
    moduleFailed: '{0} 执行失败。',
    aiUnavailable: '当前环境未配置 AI 分析。',
    aiFailed: 'AI 分析未能完成。',
  },
};
