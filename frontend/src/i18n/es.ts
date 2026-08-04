import type { Messages } from './messages';

export const es: Messages = {
  langName: 'Español',
  htmlLang: 'es',

  meta: {
    title: 'FAST — Auditoría completa de sitios: rendimiento, SEO, GEO, LGPD e IA',
    description: 'Audite cualquier sitio en segundos: rendimiento, SEO, GEO para IA, accesibilidad y seguridad, con un plan de acción priorizado. Sin registro.',
  },

  nav: {
    tagline: 'Auditoría web completa',
    cta: 'Analizar sitio',
    language: 'Idioma',
    sections: [
      { id: 'modulos', label: 'Qué analizamos' },
      { id: 'como-funciona', label: 'Cómo funciona' },
      { id: 'diferencial', label: 'Comparación' },
      { id: 'glossario', label: 'Glosario' },
      { id: 'faq', label: 'Preguntas frecuentes' },
    ],
  },

  hero: {
    badge: 'Rendimiento, SEO, seguridad y GEO en un mismo análisis',
    titleLead: 'Descubra qué está frenando su sitio —',
    titleAccent: 'también para las IA',
    lead: 'Indique la dirección y reciba en segundos un diagnóstico completo: Core Web Vitals, SEO técnico, accesibilidad, seguridad, infraestructura y GEO, la optimización para ChatGPT, Claude, Gemini y Perplexity que PageSpeed no cubre.',
    urlLabel: 'Dirección del sitio',
    placeholder: 'https://susitio.com',
    analyze: 'Analizar',
    analyzing: 'Analizando…',
    tryLabel: 'Pruebe con:',
    scrollCue: 'Ver qué analiza FAST',
    highlights: [
      { icon: 'layers', value: '11', label: 'módulos de auditoría' },
      { icon: 'check', value: '167', label: 'verificaciones por análisis' },
      { icon: 'clock', value: '~50s', label: 'para el informe completo' },
      { icon: 'shield', value: '0', label: 'datos almacenados' },
    ],
  },

  landing: {
    modules: {
      eyebrow: 'Cobertura',
      title: 'Once módulos, 167 verificaciones, una nota por dimensión',
      intro:
        'Una auditoría de FAST recorre once dimensiones de calidad y devuelve, para cada una, una nota de 0 a 100, la lista de problemas encontrados, la gravedad de cada uno, cómo corregirlo y el beneficio esperado. El análisis va más allá de la velocidad: también mide cómo leen el sitio los motores de inteligencia artificial y qué tan expuesto está a ataques, dos puntos que la mayoría de las herramientas ignora pero que hoy definen la visibilidad y la disponibilidad.',
      checksLabel: 'verificaciones',
      items: [
        {
          name: 'Rendimiento',
          checks: 24,
          desc: 'Core Web Vitals (LCP, CLS, INP, FCP, TTFB), peso de imágenes, JavaScript y fuentes, recursos que bloquean el renderizado, compresión y caché.',
        },
        {
          name: 'SEO técnico',
          checks: 23,
          desc: 'Title, meta description, canonical, jerarquía de encabezados, enlaces rotos y redirigidos, sitemap.xml, robots.txt y tarjetas sociales.',
        },
        {
          name: 'GEO',
          checks: 18,
          desc: 'llms.txt, permisos de los rastreadores de IA, estructura semántica, señales de autoridad y datos estructurados Schema.org.',
        },
        {
          name: 'Contenido',
          checks: 10,
          desc: 'Claridad, profundidad, legibilidad, redundancia, escaneabilidad y señales de contenido pobre.',
        },
        {
          name: 'Accesibilidad',
          checks: 11,
          desc: 'Contraste de colores, textos alternativos, etiquetas de formulario, navegación por teclado y marcos semánticos.',
        },
        {
          name: 'Seguridad',
          checks: 14,
          desc: 'HTTPS, validez y cadena del certificado, HSTS, Content-Security-Policy, cookies y contenido mixto.',
        },
        {
          name: 'Protección y exposición',
          checks: 11,
          desc: 'WAF, exposición de la IP de origen, claves y contraseñas en el código servido, stack traces, errores de base de datos y política de divulgación.',
        },
        {
          name: 'LGPD',
          checks: 13,
          desc: 'Consentimiento antes del rastreo, cookies grabadas sin autorización, política de privacidad, encargado (DPO) y formularios que recolectan datos personales, según la ley brasileña de protección de datos.',
        },
        {
          name: 'Infraestructura',
          checks: 15,
          desc: 'HTTP/2 y HTTP/3, compresión Brotli y Gzip, política de caché, CDN, resolución de DNS, IPv6 y cadena de redirecciones.',
        },
        {
          name: 'Móvil',
          checks: 8,
          desc: 'Viewport, roturas de diseño, tamaño de fuente, objetivos táctiles, imágenes responsivas y estabilidad visual en el móvil.',
        },
        {
          name: 'UX',
          checks: 13,
          desc: 'Navegación, jerarquía visual, consistencia tipográfica, claridad de las llamadas a la acción, formularios y tiempo hasta la interactividad.',
        },
      ],
    },

    steps: {
      eyebrow: 'Cómo funciona',
      title: 'De la URL al plan de acción en cuatro pasos',
      intro:
        'Todo el proceso es automático y toma menos de un minuto. Usted ve terminar cada módulo, en tiempo real, mientras el análisis avanza.',
      figure:
        'El camino de una auditoría: una única recolección alimenta los once módulos, y el informe consolidado es interpretado por IA antes de llegar a usted.',
      flow: [
        'URL',
        'Recolección en navegador real',
        '11 módulos en paralelo',
        'Notas y problemas',
        'Plan de acción por IA',
      ],
      items: [
        {
          title: 'Usted indica la URL',
          desc: 'Sin registro, sin instalar nada y sin tocar el código del sitio: el análisis es externo y se hace tal como un visitante (o un robot de búsqueda) ve la página.',
        },
        {
          title: 'La página se abre de verdad',
          desc: 'Un navegador Chromium real carga el sitio en escritorio y en móvil y recoge, en una sola pasada, métricas de rendimiento, red, DOM, DNS y TLS.',
        },
        {
          title: 'Once módulos analizan en paralelo',
          desc: 'Cada módulo aplica sus verificaciones sobre la misma recolección y devuelve una nota de 0 a 100, los problemas encontrados y la evidencia de cada uno.',
        },
        {
          title: 'La IA arma el plan de acción',
          desc: 'Un modelo de lenguaje lee todo el informe y escribe el resumen ejecutivo, el orden de prioridad y el paso a paso de la corrección en lenguaje claro.',
        },
      ],
    },

    comparison: {
      eyebrow: 'Comparación',
      title: 'Lo que FAST ve y las herramientas de rendimiento no',
      intro:
        'Las herramientas de rendimiento responden “¿el sitio es rápido?”. FAST responde además “¿el sitio se encuentra, lo entienden las IA y está protegido?”.',
      caption: 'Comparación entre FAST y las herramientas tradicionales de rendimiento',
      colFeature: 'Verificación',
      colFast: 'FAST',
      colOthers: 'Herramientas de rendimiento',
      yes: 'sí',
      no: 'no',
      partial: 'parcial',
      rows: [
        { feature: 'Core Web Vitals y rendimiento', pagespeed: true },
        { feature: 'SEO técnico (encabezados, canonical, sitemap, enlaces rotos)', pagespeed: 'partial' },
        { feature: 'GEO — llms.txt y rastreadores de IA', pagespeed: false },
        { feature: 'Cabeceras de seguridad, TLS y cookies', pagespeed: false },
        { feature: 'Exposición: WAF, IP de origen, claves en el código', pagespeed: false },
        { feature: 'Accesibilidad y UX', pagespeed: 'partial' },
  { feature: 'LGPD: consentimiento, cookies y política de privacidad', pagespeed: false },
        { feature: 'Plan de acción priorizado por IA', pagespeed: false },
        { feature: 'Exportación en PDF y en JSON para IA', pagespeed: false },
      ],
    },

    glossary: {
      eyebrow: 'Definiciones',
      title: 'Los términos que aparecen en el informe',
      intro:
        'Cada problema señalado por FAST viene explicado en el propio informe. Este glosario reúne los conceptos que más se repiten.',
      terms: [
        {
          term: 'GEO (Generative Engine Optimization)',
          def: 'GEO es la optimización de un sitio para motores generativos: ChatGPT, Claude, Gemini, Perplexity y Copilot. Mientras el SEO disputa una posición en la lista de resultados, el GEO disputa ser la fuente citada dentro de la respuesta ya elaborada que lee el usuario.',
        },
        {
          term: 'llms.txt',
          def: 'El llms.txt es un archivo en Markdown publicado en la raíz del dominio que presenta el sitio a los modelos de lenguaje: qué es, qué páginas importan y cómo interpretarlas. Funciona para la IA como el robots.txt funciona para el buscador; el de FAST, por ejemplo, está en /llms.txt.',
        },
        {
          term: 'Core Web Vitals',
          def: 'Core Web Vitals son las tres métricas con las que Google mide la experiencia real de carga: LCP (cuándo aparece el elemento más grande), CLS (cuánto salta el diseño) e INP (el tiempo de respuesta a la interacción).',
        },
        {
          term: 'CSP (Content-Security-Policy)',
          def: 'La CSP es una cabecera HTTP que declara desde qué orígenes puede la página cargar scripts, estilos e imágenes. Consiste en la principal defensa contra XSS: un script inyectado que no venga de un origen declarado simplemente no se ejecuta.',
        },
        {
          term: 'HSTS',
          def: 'HSTS significa HTTP Strict Transport Security. Es la cabecera que instruye al navegador a hablar con el dominio solo por HTTPS, sin esperar la redirección, lo que cierra la ventana de interceptación de la primera visita.',
        },
        {
          term: 'Schema.org',
          def: 'Schema.org se refiere al vocabulario de datos estructurados que describe el significado del contenido en JSON-LD. Es lo que permite a un buscador entender que un fragmento es una pregunta frecuente, un producto o una organización, y no solo texto.',
        },
      ],
    },

    faq: {
      eyebrow: 'Preguntas frecuentes',
      title: 'Dudas comunes sobre la auditoría',
      items: [
        {
          q: '¿FAST sustituye a Google PageSpeed?',
          a: 'FAST cubre el rendimiento igual que PageSpeed y va más allá: evalúa SEO técnico, GEO (optimización para IA), accesibilidad, seguridad, exposición a ataques y UX, explicando cada problema con su prioridad, tiempo estimado y beneficio esperado.',
        },
        {
          q: '¿FAST guarda los resultados de las auditorías?',
          a: 'No. No hay registro ni base de datos. El informe existe solo durante la ejecución y se descarta al final: si recarga la página, desaparece. Por eso la exportación en PDF y en JSON está a mano en la parte superior del informe.',
        },
        {
          q: '¿Qué es el módulo GEO?',
          a: 'GEO es la optimización para motores de IA como ChatGPT, Claude, Gemini y Perplexity. FAST valida llms.txt, los permisos de los rastreadores de IA, los datos estructurados y las señales de autoridad.',
        },
        {
          q: '¿FAST realiza pruebas de intrusión?',
          a: 'No. La evaluación de seguridad y protección es estrictamente pasiva: analiza solo lo que el sitio ya devuelve al ser visitado, sin enviar ningún payload de ataque. Es seguro apuntarla a un sitio en producción.',
        },
        {
          q: '¿FAST audita el cumplimiento de la LGPD?',
          a: 'FAST verifica lo observable desde fuera: si los rastreadores y las cookies se disparan antes del consentimiento, si hay un banner con opción de rechazo, si la política de privacidad existe y cita la LGPD, si el encargado (DPO) está identificado y si los formularios advierten sobre el uso de los datos. No sustituye un dictamen jurídico: la base legal, el registro de las operaciones y los contratos con operadores no son visibles desde el navegador.',
        },
        {
          q: '¿Cuánto tarda una auditoría?',
          a: 'Entre 30 y 60 segundos en la mayoría de los sitios. Cargar la página en un navegador real es el paso más lento; los once módulos se ejecutan en paralelo sobre la misma recolección, y la interpretación por IA ocurre al final.',
        },
        {
          q: '¿Necesito instalar algo o tocar el código del sitio?',
          a: 'No. El análisis es externo y ve el sitio como cualquier visitante: basta con la URL pública. No hay que agregar ningún script, etiqueta ni permiso al sitio analizado.',
        },
        {
          q: '¿Puedo analizar un sitio en preproducción o detrás de una contraseña?',
          a: 'Solo si la URL es accesible públicamente. Los entornos protegidos por inicio de sesión, VPN o lista de IPs quedan fuera del alcance, porque la recolección parte desde fuera y sin credenciales.',
        },
        {
          q: '¿Cómo uso el informe dentro de una IA?',
          a: 'Expórtelo en JSON: el archivo ya sale con una cabecera de instrucciones y un glosario de los campos. Pegue ese archivo en un chat de IA y pida el detalle de las correcciones, por ejemplo el fragmento de configuración de nginx para las cabeceras que faltan.',
        },
      ],
    },

    summary: {
      eyebrow: 'En resumen',
      title: 'Lo esencial en cinco líneas',
      cta: 'Analizar un sitio ahora',
      points: [
        'FAST audita cualquier sitio público en menos de un minuto, sin registro y sin instalar nada.',
        'Son 167 verificaciones distribuidas en once módulos, de Core Web Vitals a la conformidad con la LGPD.',
        'Cada problema viene con su gravedad, tiempo estimado de corrección y beneficio esperado.',
        'Una IA interpreta el informe y entrega el plan de acción ya priorizado.',
        'No se almacena nada: el informe vive en su pantalla y usted se lo lleva en PDF o JSON.',
      ],
    },

    refs: {
      eyebrow: 'Referencias',
      title: 'Estándares que FAST aplica',
      intro: 'Las verificaciones siguen especificaciones públicas; consulte la fuente de cada una:',
      items: [
        { label: 'Core Web Vitals — web.dev', url: 'https://web.dev/articles/vitals' },
        { label: 'Especificación de llms.txt', url: 'https://llmstxt.org/' },
        { label: 'Vocabulario Schema.org', url: 'https://schema.org/' },
        { label: 'WCAG 2.2 — W3C', url: 'https://www.w3.org/WAI/WCAG22/quickref/' },
        { label: 'Content-Security-Policy — MDN', url: 'https://developer.mozilla.org/es/docs/Web/HTTP/Guides/CSP' },
        { label: 'RFC 9116 — security.txt', url: 'https://www.rfc-editor.org/info/rfc9116/' },
        { label: 'Protocolo de sitemaps', url: 'https://www.sitemaps.org/protocol.html' },
      ],
    },
  },

  progress: {
    title: 'Auditoría en curso',
    starting: 'Iniciando…',
    done: 'finalizado',
    failed: 'falló',
    running: 'analizando…',
    queued: 'en cola',
  },

  report: {
    back: '← Analizar otro sitio',
    aiButton: 'Análisis IA',
    overall: 'Nota general',
    analyzedAt: 'Analizado el',
    runtime: 'de ejecución',
    stats: {
      issues: 'problemas',
      critical: 'críticos',
      high: 'altos',
      aiScore: 'IA Score',
      fixTime: 'de corrección',
    },
    exportPdf: 'Exportar PDF',
    exportingPdf: 'Generando PDF…',
    exportJson: 'Exportar JSON',
    pdfError: 'No fue posible generar el PDF. Inténtelo de nuevo.',
    noIssues: 'Sin problemas',
    issuesCount: 'problema(s)',
    viewDetails: 'Ver detalles',
    issuesTitle: 'Problemas encontrados',
    filterCategory: 'Filtrar por categoría',
    filterSeverity: 'Filtrar por gravedad',
    allCategories: 'Todas las categorías',
    allSeverities: 'Todas las gravedades',
    emptyFiltered: 'Ningún problema con los filtros seleccionados.',
    modulesTitle: 'Detalle por módulo',
    modulesIntro: 'Todas las verificaciones ejecutadas, con el valor medido en cada una.',
    checklistTitle: 'Lista de correcciones',
    checklistProgress: 'completado(s): el progreso es local y no se guarda en ningún servidor.',
    moduleFailed: 'El módulo falló:',
    recommendations: 'Recomendaciones',
    checksCaption: 'Verificaciones del módulo',
  },

  issue: {
    howToFix: 'Cómo corregir',
    expectedGain: 'Beneficio esperado',
    impact: 'Impacto',
    difficulty: 'Dificultad',
    estimatedTime: 'Tiempo estimado',
    evidence: 'Evidencias',
  },

  plan: { title: 'Plan de acción', steps: 'etapas' },

  jsonExport: {
    format: 'Informe de auditoría web FAST',
    instructions:
      'Este es el informe completo de una auditoría automatizada del sitio indicado abajo. ' +
      'Cada módulo tiene una nota de 0 a 100, verificaciones (checks) con el valor medido y ' +
      'problemas (issues) con gravedad, impacto, dificultad, tiempo estimado de corrección, ' +
      'cómo corregirlo (howToFix), beneficio esperado (expectedGain) y evidencias. El campo ' +
      '"ai" trae un análisis en lenguaje natural. Use estos datos para explicar los problemas, ' +
      'priorizarlos y detallar las correcciones. No invente métricas que no estén aquí.',
    glossary: {
      overallScore: 'Nota general de 0 a 100.',
      categories: 'Nota, peso y número de problemas por categoría.',
      plugins: 'Cada módulo de auditoría: checks (verificaciones), issues (problemas) y evidence (evidencias brutas).',
      issues: 'Lista consolidada de problemas, ordenada por prioridad.',
      ai: 'Interpretación por IA: resumen, prioridades, impactos, beneficios y plan de acción.',
      checklist: 'Elementos de corrección derivados de los problemas.',
      summary: 'Recuento de problemas por gravedad y tiempo total estimado.',
    },
  },

  ai: {
    badge: 'Análisis por IA',
    open: 'Abrir análisis',
    title: 'Análisis por IA',
    subtitle: 'Interpretación del informe técnico',
    close: 'Cerrar',
    executive: 'Resumen ejecutivo',
    mainProblems: 'Principales problemas',
    priorities: 'Orden de prioridad',
    impacts: 'Impacto en el negocio',
    gains: 'Beneficios estimados',
    notes: 'Notas técnicas',
    foot: 'Generado por IA a partir de los datos de la auditoría. El plan de acción detallado está en la página.',
    unavailable: 'Análisis por IA no disponible.',
    unavailableHint:
      'La auditoría técnica se completó con normalidad; solo no se generó la interpretación en lenguaje natural.',
  },

  labels: {
    severity: {
      critical: 'Crítico',
      high: 'Alto',
      medium: 'Medio',
      low: 'Bajo',
      info: 'Informativo',
    },
    priority: {
      alta: 'Prioridad alta',
      media: 'Prioridad media',
      baixa: 'Prioridad baja',
    },
    impact: { alto: 'Alto', medio: 'Medio', baixo: 'Bajo' },
    difficulty: { facil: 'Fácil', media: 'Media', dificil: 'Difícil' },
    score: {
      excellent: 'Excelente',
      good: 'Bueno',
      fair: 'Necesita mejorar',
      poor: 'Crítico',
    },
    minutes: 'min',
    hours: 'h',
    workdays: 'día(s) de trabajo',
  },

  errors: {
    auditFailed: 'No fue posible completar la auditoría',
    retry: 'Intentar de nuevo',
    connectionLost: 'Se interrumpió la conexión con el servidor. Inténtelo de nuevo.',
  },

  footer: {
    blurb:
      'Auditoría ejecutada bajo demanda, sin autenticación y sin persistencia. Ningún resultado se almacena tras finalizar el análisis.',
    legalUrl: '/privacidad.html',
    privacy: 'Política de privacidad',
    termsAnchor: '#terminos',
    terms: 'Términos de uso',
    by: 'Por',
    updated: 'actualizado el',
  },
};
