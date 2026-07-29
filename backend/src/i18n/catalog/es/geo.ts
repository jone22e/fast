import type { PluginCatalog } from '../../types.js';

export const geo: PluginCatalog = {
  name: 'GEO — Generative Engine Optimization',
  description:
    'Optimización para motores de IA: llms.txt, permisos de rastreadores, estructura semántica, autoridad y datos estructurados.',
  checks: {
    'llms-exists': 'llms.txt disponible',
    'llms-encoding': 'llms.txt en UTF-8',
    'llms-size': 'llms.txt con un tamaño razonable',
    'llms-format': 'llms.txt en Markdown (no HTML)',
    'llms-h1': 'llms.txt con título H1',
    'llms-summary': 'llms.txt con resumen',
    'llms-sections': 'llms.txt con secciones',
    'llms-links': 'llms.txt con enlaces internos',
    'llms-full': 'llms-full.txt disponible',
    'ai-crawlers': 'Rastreadores de IA con acceso permitido',
    'ai-definitions': 'Definiciones claras en el texto',
    'ai-faq': 'Sección de preguntas frecuentes',
    'ai-lists': 'Uso de listas',
    'ai-tables': 'Uso de tablas',
    'ai-steps': 'Contenido paso a paso',
    'ai-examples': 'Ejemplos concretos',
    'ai-summary': 'Resumen o conclusión',
    'authority-author': 'Autoría identificada',
    'authority-published': 'Fecha de publicación',
    'authority-modified': 'Fecha de actualización',
    'authority-refs': 'Referencias externas',
    'semantic-tags': 'Etiquetas semánticas HTML5',
    'schema-present': 'Datos estructurados presentes',
    'schema-valid': 'JSON-LD sin errores de sintaxis',
    'schema-coverage': 'Cobertura de tipos relevantes',
  },
  issues: {
    'geo-no-llms-txt': {
      title: 'Archivo llms.txt ausente',
      description:
        'llms.txt es la convención emergente para orientar a los modelos de lenguaje sobre el contenido del sitio: qué es, qué páginas importan y cómo interpretarlas. Sin él, ChatGPT, Claude, Perplexity y Gemini deben adivinar la estructura a partir del HTML.',
      fix: 'Cree /llms.txt en Markdown: un "# Nombre del sitio" arriba, un párrafo de resumen que empiece por "> " y secciones "## " que agrupen enlaces a las páginas más importantes, cada uno con una frase de descripción.',
      gain: 'Más probabilidad de ser citado correctamente por los motores de IA y menos alucinaciones sobre su producto.',
    },
    'geo-llms-html': {
      title: 'llms.txt está devolviendo HTML',
      description:
        'El servidor devuelve la página de error o el SPA en lugar del archivo de texto. Los modelos que busquen el archivo recibirán markup inútil.',
      fix: 'Sirva /llms.txt como archivo estático con Content-Type: text/plain; charset=utf-8, antes de cualquier ruta catch-all de la aplicación.',
      gain: 'El archivo pasa a ser realmente consumible por los modelos de IA.',
    },
    'geo-llms-weak': {
      title: 'llms.txt con estructura incompleta',
      fix: 'Estructúrelo así: "# Nombre", "> resumen en una frase", luego "## Docs", "## Productos", etc., con enlaces en el formato "- [Título](url): descripción".',
      gain: 'Respuestas de IA más precisas sobre lo que ofrece el sitio.',
    },
    'geo-blocked-ai-crawlers': {
      title: '{0} rastreador(es) de IA importante(s) bloqueado(s)',
      description:
        'El robots.txt impide el acceso de: {0}. Si el bloqueo no es intencional, el sitio queda invisible para los motores generativos que hoy responden buena parte de las búsquedas informativas.',
      fix: 'Revise el robots.txt. Para permitirlos, agregue un grupo por rastreador: "User-agent: GPTBot" seguido de "Allow: /". Atención: un "Disallow: /" en "User-agent: *" bloquea a todos los que no tienen regla propia.',
      gain: 'Presencia en las respuestas de ChatGPT, Claude, Perplexity, Copilot y AI Overviews de Google.',
    },
    'geo-blocked-secondary-crawlers': {
      title: '{0} rastreador(es) de IA secundario(s) bloqueado(s)',
      description:
        'Bloqueados: {0}. Impacto menor, pero reduce el alcance en modelos entrenados sobre esas bases.',
      fix: 'Si el bloqueo no es intencional (por ejemplo, por política de uso de contenido), permita esos agentes en el robots.txt.',
      gain: 'Cobertura más amplia entre los modelos de lenguaje.',
    },
    'geo-no-faq': {
      title: 'Sin sección de preguntas frecuentes',
      description:
        'Los bloques de pregunta y respuesta son el formato que los modelos de IA extraen y citan con mayor facilidad, porque ya vienen con la forma de la respuesta que busca el usuario.',
      fix: 'Cree una sección "Preguntas frecuentes" con 5 a 10 pares pregunta/respuesta concretos y márquela con Schema.org FAQPage.',
      gain: 'Aumento significativo en la probabilidad de cita directa por ChatGPT, Perplexity y AI Overviews.',
    },
    'geo-no-authority': {
      title: 'Señales de autoridad ausentes: {0}',
      description:
        'Los modelos de IA priorizan fuentes que declaran quién escribió y cuándo. El contenido sin autoría ni fecha se considera menos confiable y menos citable.',
      fix: 'Agregue <meta name="author">, <meta property="article:published_time"> y article:modified_time, además de un bloque visible de autoría. Complemente con Schema.org Article con author, datePublished y dateModified.',
      gain: 'Mayor peso de confiabilidad (E-E-A-T) y más citas en respuestas generadas.',
    },
    'geo-no-main': {
      title: 'Sin elemento <main>',
      description:
        '<main> delimita el contenido principal y lo separa de menús, pies de página y barras laterales. Sin él, los extractores de contenido (incluidos los de IA) suelen capturar la navegación junto con el texto.',
      fix: 'Envuelva el contenido principal en <main> (uno por página) y mueva los menús a <nav> y el pie a <footer>.',
      gain: 'Extracción de contenido más limpia por IA y lectores de pantalla.',
    },
    'geo-weak-semantics': {
      title: 'Solo {0} de {1} etiquetas semánticas en uso',
      description:
        'La página depende mayoritariamente de <div>, que no transmite ningún significado estructural a las máquinas.',
      fix: 'Sustituya los div estructurales por header, nav, main, article, section, aside, figure/figcaption, footer y time.',
      gain: 'Mejor comprensión de la estructura por buscadores y modelos generativos.',
    },
    'geo-no-schema': {
      title: 'Sin datos estructurados (Schema.org)',
      description:
        'Los datos estructurados en JSON-LD son la forma más directa de declarar hechos sobre la página sin ambigüedad: quién es la organización, cuál es el producto, cuál el precio, quién lo escribió. Los modelos de IA y los buscadores lo usan como fuente de alta confianza.',
      fix: 'Agregue un bloque <script type="application/ld+json"> con al menos Organization (o LocalBusiness) y el tipo específico de la página (Article, Product, Service, FAQPage). Valídelo en el Rich Results Test de Google.',
      gain: 'Elegibilidad para resultados enriquecidos y mayor precisión en las respuestas de IA sobre la marca.',
    },
    'geo-schema-invalid': {
      title: '{0} bloque(s) JSON-LD con error de sintaxis',
      description:
        'El JSON malformado se descarta en silencio: el esfuerzo de marcado no produce ningún efecto.',
      fix: 'Valide cada bloque JSON-LD en un validador de JSON y en el Rich Results Test de Google.',
      gain: 'Los datos estructurados pasan a leerse realmente.',
    },
  },
};
