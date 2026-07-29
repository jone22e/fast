import type { PluginCatalog } from '../../types.js';

export const seo: PluginCatalog = {
  name: 'SEO tradicional',
  description: 'Etiquetas HTML, jerarquía de encabezados, enlaces, sitemap, robots.txt y tarjetas sociales.',
  checks: {
    title: 'Title presente y con el tamaño adecuado',
    description: 'Meta description',
    canonical: 'URL canónica declarada',
    'robots-meta': 'Meta robots permite la indexación',
    viewport: 'Meta viewport',
    charset: 'Charset declarado',
    lang: 'Atributo lang en <html>',
    h1: 'H1 único',
    'heading-order': 'Jerarquía de encabezados sin saltos',
    'heading-empty': 'Encabezados con contenido',
    'internal-links': 'Enlaces internos',
    'external-links': 'Enlaces externos',
    'link-rel': 'Enlaces externos con rel seguro',
    'broken-links': 'Enlaces sin errores',
    redirects: 'Enlaces sin redirecciones',
    'page-redirects': 'Página sin cadena de redirecciones',
    'robots-txt': 'robots.txt accesible',
    'robots-not-blocking': 'robots.txt no bloquea todo el sitio',
    'robots-sitemap': 'Sitemap declarado en robots.txt',
    sitemap: 'sitemap.xml disponible',
    'sitemap-valid': 'URLs del sitemap válidas',
    'open-graph': 'Open Graph completo',
    twitter: 'Twitter Cards',
  },
  issues: {
    'seo-no-title': {
      title: 'Página sin etiqueta <title>',
      description:
        'El título es la principal señal de relevancia para los buscadores y el texto que se muestra en los resultados.',
      fix: 'Agregue <title> en el <head> con 30 a 65 caracteres, que incluya la palabra clave principal y la marca.',
      gain: 'Requisito básico para la indexación y para el CTR en los resultados de búsqueda.',
    },
    'seo-title-length': {
      title: 'Title con {0} caracteres',
      fix: 'Reescriba el título con 30 a 65 caracteres, comenzando por el término más relevante.',
      gain: 'Mayor tasa de clics en los resultados de búsqueda.',
    },
    'seo-no-description': {
      title: 'Meta description ausente',
      description:
        'Sin descripción, el buscador arma un fragmento automático a partir del contenido, normalmente menos persuasivo.',
      fix: 'Agregue <meta name="description" content="..."> con 70 a 165 caracteres que resuma la propuesta de la página.',
      gain: 'Aumento típico del 5% al 15% en la tasa de clics.',
    },
    'seo-no-canonical': {
      title: 'Sin enlace canónico',
      description:
        'Sin canonical, las variaciones de URL (con parámetros, con o sin barra final) pueden tratarse como páginas duplicadas.',
      fix: 'Agregue <link rel="canonical" href="URL absoluta preferida"> en el <head> de cada página.',
      gain: 'Autoridad consolidada en una sola URL.',
    },
    'seo-noindex': {
      title: 'Página marcada como noindex',
      description:
        'La meta robots indica a los buscadores que no indexen esta página. Si no es intencional, la página es invisible en las búsquedas.',
      fix: 'Elimine el valor noindex de la meta robots o confirme que la exclusión es intencional.',
      gain: 'Permite que la página aparezca en los resultados de búsqueda.',
    },
    'seo-no-lang': {
      title: 'Atributo lang ausente en <html>',
      description:
        'Buscadores y lectores de pantalla usan lang para determinar el idioma y la pronunciación correcta del contenido.',
      fix: 'Agregue lang="es" (o el idioma correcto) en la etiqueta <html>.',
      gain: 'Mejor segmentación por idioma y accesibilidad.',
    },
    'seo-no-h1': {
      title: 'Página sin H1',
      description:
        'El H1 define el tema principal de la página para buscadores y lectores de pantalla.',
      fix: 'Agregue un único <h1> que describa el asunto principal de la página.',
      gain: 'Señal clara de tema para buscadores e IA.',
    },
    'seo-multiple-h1': {
      title: '{0} etiquetas H1 en la misma página',
      description: 'Varios H1 diluyen la señal de cuál es el tema principal.',
      fix: 'Mantenga un único H1 y convierta los demás en H2.',
      gain: 'Jerarquía semántica más clara.',
    },
    'seo-heading-skip': {
      title: '{0} salto(s) en la jerarquía de encabezados',
      description:
        'Saltar niveles (por ejemplo de H2 directo a H4) rompe la estructura lógica del documento para lectores de pantalla y para modelos de IA que extraen el esquema.',
      fix: 'Reordene los encabezados para bajar un nivel a la vez. Use CSS para el tamaño visual, no la etiqueta.',
      gain: 'Estructura de documento más comprensible para las máquinas.',
    },
    'seo-unsafe-blank': {
      title: '{0} enlace(s) target="_blank" sin rel="noopener"',
      description:
        'La página de destino obtiene acceso parcial a la ventana de origen: un riesgo de seguridad y de rendimiento.',
      fix: 'Agregue rel="noopener noreferrer" a todos los enlaces con target="_blank".',
      gain: 'Elimina el riesgo de tabnabbing.',
    },
    'seo-broken-links': {
      title: '{0} enlace(s) roto(s)',
      description:
        'De una muestra de {0} enlaces, {1} devolvieron error o no respondieron. Los enlaces rotos perjudican la experiencia y desperdician autoridad de página.',
      fix: 'Corrija o elimine los enlaces indicados. Para páginas movidas, configure una redirección 301 permanente.',
      gain: 'Mejor rastreo por los buscadores y menos callejones sin salida para el usuario.',
    },
    'seo-redirect-chain': {
      title: 'Cadena de {0} redirecciones',
      description:
        'Cada salto agrega un viaje completo de red antes de que el contenido empiece a cargar.',
      fix: 'Apunte la primera redirección directamente a la URL final, eliminando los saltos intermedios.',
      gain: 'Ahorro de 100 ms a 500 ms por visita.',
    },
    'seo-no-robots': {
      title: 'robots.txt ausente o inaccesible',
      description:
        'Sin robots.txt, los rastreadores no reciben orientación sobre qué rastrear ni dónde está el sitemap.',
      fix: 'Cree /robots.txt en la raíz con las reglas de rastreo y una línea `Sitemap: https://sudominio/sitemap.xml`.',
      gain: 'Rastreo más eficiente y descubrimiento automático del sitemap.',
    },
    'seo-robots-blocks-all': {
      title: 'robots.txt bloquea todo el sitio',
      description:
        'La regla `Disallow: /` para User-agent: * impide que cualquier buscador rastree el sitio.',
      fix: 'Elimine o restrinja la regla Disallow: / a los directorios específicos que realmente no deben rastrearse.',
      gain: 'Restaura la capacidad del sitio de aparecer en las búsquedas.',
    },
    'seo-no-sitemap': {
      title: 'Sitemap XML no encontrado',
      description:
        'El sitemap acelera el descubrimiento de páginas nuevas y señala la estructura del sitio a los buscadores.',
      fix: 'Genere un sitemap.xml con todas las URLs canónicas, publíquelo en /sitemap.xml y decláre­lo en robots.txt y en Search Console.',
      gain: 'Indexación más rápida del contenido nuevo.',
    },
    'seo-sitemap-invalid': {
      title: '{0} URL inválida(s) en el sitemap',
      description: 'Las URLs malformadas del sitemap son descartadas por los rastreadores.',
      fix: 'Use solo URLs absolutas y correctamente codificadas en el sitemap.',
      gain: 'Todas las páginas listadas pasan a ser consideradas.',
    },
    'seo-og-incomplete': {
      title: 'Open Graph incompleto (faltan {0} etiquetas)',
      description:
        'Sin las etiquetas Open Graph, al compartir en redes sociales y apps de mensajería se muestra una tarjeta genérica y sin imagen.',
      gain: 'Tarjetas de compartición atractivas y más clics desde redes sociales.',
    },
  },
};
