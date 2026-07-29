import type { PluginCatalog } from '../../types.js';

export const content: PluginCatalog = {
  name: 'Contenido',
  description: 'Claridad, profundidad, legibilidad, redundancia, escaneabilidad y señales de contenido pobre.',
  checks: {
    'word-count': 'Volumen de contenido',
    readability: 'Índice de legibilidad',
    'sentence-length': 'Longitud media de las frases',
    scannability: 'Escaneabilidad (un encabezado cada ~200 palabras)',
    structure: 'Uso de listas y tablas',
    'keyword-density': 'Densidad de palabra clave saludable',
    redundancy: 'Baja redundancia',
    promotional: 'Equilibrio entre contenido y promoción',
    depth: 'Profundidad argumentativa',
    vocabulary: 'Riqueza de vocabulario',
  },
  issues: {
    'content-thin': {
      title: 'Contenido pobre ({0} palabras)',
      description:
        'Las páginas con poco texto rara vez responden por completo a la intención del usuario y son postergadas tanto por los buscadores como por los modelos de IA, que necesitan material suficiente para extraer una respuesta.',
      fix: 'Amplíe el contenido cubriendo las dudas reales del público: contexto, cómo funciona, para quién sirve, comparaciones y ejemplos. Apunte a más de 600 palabras de sustancia, no de relleno.',
      gain: 'Cobertura de más términos de búsqueda y mayor probabilidad de cita por IA.',
    },
    'content-hard-to-read': {
      title: 'Texto de lectura difícil (índice {0}/100)',
      description:
        'Frases con una media de {0} palabras y vocabulario extenso vuelven la lectura cansada y reducen la permanencia en la página.',
      fix: 'Divida las frases largas en dos, prefiera la voz activa, sustituya los tecnicismos innecesarios y limite los párrafos a 3 o 4 líneas.',
      gain: 'Mayor tiempo de permanencia y menor tasa de rebote.',
    },
    'content-no-structure': {
      title: 'Texto largo sin división en secciones',
      description:
        '{0} palabras con apenas {1} encabezado(s). Los bloques densos de texto son difíciles de escanear y de segmentar automáticamente.',
      fix: 'Divida el contenido en secciones de 150 a 300 palabras, cada una con un H2 o H3 descriptivo.',
      gain: 'Lectura más rápida y mejor extracción por los motores de IA.',
    },
    'content-keyword-stuffing': {
      title: 'Repetición excesiva del término "{0}" ({1}%)',
      description:
        'Una densidad superior al 4% se interpreta como intento de manipulación por los buscadores y vuelve el texto artificial para el lector.',
      fix: 'Sustituya las repeticiones por sinónimos y variaciones naturales, y reescriba las frases donde el término aparece forzado.',
      gain: 'Texto más natural y menor riesgo de penalización.',
    },
    'content-duplicate': {
      title: '{0} frases repetidas en el contenido',
      description:
        'La repetición de fragmentos indica contenido generado por plantilla o revisión insuficiente, y reduce el valor percibido de la página.',
      fix: 'Revise el texto eliminando párrafos redundantes y consolidando la información repetida.',
      gain: 'Contenido más denso en información por palabra leída.',
    },
    'content-too-promotional': {
      title: 'Exceso de lenguaje promocional',
      description:
        '{0} frases comerciales en {1} palabras. El contenido predominantemente promocional es desvalorizado por los buscadores y rara vez citado por la IA como fuente informativa.',
      fix: 'Equilibre la página: informe primero (qué es, cómo funciona, para quién), venda después. Mantenga las CTA, pero reduzca la repetición.',
      gain: 'Más confianza del lector y mayor elegibilidad como fuente informativa.',
    },
  },
};
