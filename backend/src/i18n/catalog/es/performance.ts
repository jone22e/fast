import type { PluginCatalog } from '../../types.js';

export const performance: PluginCatalog = {
  name: 'Rendimiento',
  description: 'Core Web Vitals, peso de los recursos, estrategia de carga y eficiencia de red.',
  checks: {
    lcp: 'Largest Contentful Paint',
    cls: 'Cumulative Layout Shift',
    inp: 'Interaction to Next Paint',
    fcp: 'First Contentful Paint',
    ttfb: 'Time To First Byte',
    si: 'Speed Index',
    tbt: 'Total Blocking Time',
    'total-weight': 'Peso total de la página',
    'img-weight': 'Peso de las imágenes',
    'js-weight': 'Peso del JavaScript',
    'css-weight': 'Peso del CSS',
    'font-weight': 'Peso de las fuentes',
    'media-weight': 'Peso de vídeo/medios',
    requests: 'Número de solicitudes',
    'img-sizing': 'Imágenes con dimensiones correctas',
    'img-format': 'Formatos de imagen modernos',
    lazy: 'Lazy loading en imágenes bajo el pliegue',
    preload: 'Uso de preload',
    preconnect: 'Uso de preconnect/dns-prefetch',
    prefetch: 'Uso de prefetch',
    'render-blocking': 'Recursos que bloquean el renderizado',
    compression: 'Compresión de texto',
    brotli: 'Brotli habilitado',
    cache: 'Caché de recursos estáticos',
  },
  issues: {
    'perf-lcp': {
      title: 'LCP de {0} por encima de lo recomendado',
      description:
        'El elemento visible más grande tarda más de 2,5 s en aparecer. Es la métrica que Google más pondera al evaluar la velocidad percibida.',
      fix: 'Identifique el elemento LCP (normalmente la imagen principal o el título). Aplíquele preload, sirva las imágenes en WebP/AVIF con las dimensiones correctas y elimine los recursos bloqueantes que lo preceden.',
      gain: 'Reducción aproximada de {0} s en la carga percibida.',
    },
    'perf-cls': {
      title: 'Diseño inestable (CLS {0})',
      description:
        'Los elementos cambian de posición durante la carga, lo que provoca clics erróneos y sensación de inestabilidad.',
      fix: 'Declare width y height en todas las imágenes e iframes, reserve espacio para banners y anuncios, y use font-display: optional o swap con un fallback métricamente compatible.',
      gain: 'CLS por debajo de 0,1 y menos clics accidentales.',
    },
    'perf-tbt': {
      title: 'JavaScript bloquea el hilo principal durante {0}',
      description:
        'Se detectaron {0} tareas largas. Mientras se ejecutan, la página no responde ni a clics ni al desplazamiento.',
      fix: 'Divida el bundle con code splitting, aplace los scripts no críticos con defer, mueva el procesamiento pesado a Web Workers y elimine las bibliotecas sin uso.',
      gain: 'Interactividad más rápida e INP dentro del rango bueno.',
    },
    'perf-ttfb': {
      title: 'El servidor tarda {0} en responder',
      description:
        'Un TTFB alto retrasa todo lo demás: nada puede empezar antes de la primera respuesta.',
      fix: 'Active la caché de página en el servidor, use un CDN, optimice las consultas a la base de datos y revise si hay redirecciones innecesarias antes de la respuesta.',
      gain: 'Hasta {0} s menos en todas las páginas.',
    },
    'perf-heavy-images': {
      title: '{0} imagen(es) por encima de 300 KB',
      description:
        'La mayor pesa {0}. Las imágenes pesadas son la causa más común de un LCP alto, sobre todo en conexiones móviles.',
      fix: 'Convierta a WebP o AVIF, redimensione al tamaño real de visualización y sirva variantes responsivas con srcset.',
      gain: 'Ahorro estimado de {0} y unos {1} s menos en 4G.',
    },
    'perf-oversized-images': {
      title: '{0} imagen(es) mucho mayor(es) que el espacio mostrado',
      description:
        'La imagen se descarga en alta resolución y el navegador la reduce: los bytes extra se desperdician.',
      fix: 'Genere versiones con las dimensiones reales de visualización y use srcset con sizes para servir la variante adecuada a cada pantalla.',
      gain: 'Entre un 40% y un 70% menos de peso en las imágenes afectadas.',
    },
    'perf-legacy-image-format': {
      title: '{0} imágenes en JPEG/PNG/GIF',
      description:
        'WebP y AVIF ofrecen la misma calidad visual con entre un 25% y un 50% menos de bytes.',
      fix: 'Convierta las imágenes a WebP (o AVIF) y use la etiqueta <picture> con fallback para navegadores antiguos.',
      gain: 'Reducción media del 30% en el peso total de imágenes.',
    },
    'perf-no-lazy': {
      title: 'Imágenes bajo el pliegue sin lazy loading',
      description:
        '{0} imágenes fuera de la pantalla inicial se descargan de inmediato y compiten con el contenido visible.',
      fix: 'Agregue loading="lazy" a las imágenes que no aparecen en la primera pantalla. Nunca lo aplique a la imagen del LCP.',
      gain: 'Menos bytes en la carga inicial y un LCP más rápido.',
    },
    'perf-render-blocking': {
      title: '{0} recursos bloquean el renderizado',
      description:
        '{0} hojas de estilo y {1} scripts síncronos en el <head> impiden que la página aparezca hasta que se descarguen y procesen.',
      fix: 'Incruste el CSS crítico del primer pliegue, cargue el resto con media="print" onload y agregue defer o async a los scripts del head.',
      gain: 'FCP y LCP típicamente entre 0,5 s y 1,5 s más rápidos.',
    },
    'perf-no-compression': {
      title: '{0} recursos de texto sin compresión',
      description:
        'HTML, CSS y JavaScript sin Gzip/Brotli viajan con entre 3 y 5 veces más bytes de los necesarios.',
      fix: 'Active Brotli (con fallback a Gzip) en el servidor web o en el CDN. En nginx: `brotli on; gzip on;` para los tipos MIME de texto.',
      gain: 'Ahorro estimado de {0} por visita.',
    },
    'perf-weak-cache': {
      title: 'Recursos estáticos con caché corta o ausente',
      description:
        '{0} archivos estáticos no tienen Cache-Control con un max-age de al menos un día, lo que fuerza una nueva descarga en cada visita.',
      fix: 'Configure Cache-Control: public, max-age=31536000, immutable para los archivos versionados (con hash en el nombre) y valores menores para el HTML.',
      gain: 'Las visitas recurrentes se vuelven prácticamente instantáneas.',
    },
    'perf-bundle-size': {
      title: 'Bundle de JavaScript de {0}',
      description:
        'Los bundles grandes deben descargarse, analizarse y ejecutarse antes de que la página sea interactiva.',
      fix: 'Active tree shaking, divida el código por ruta, cargue los componentes pesados bajo demanda y audite las dependencias con el analizador de su bundler.',
      gain: 'Reducción típica del 30% al 60% en el JavaScript inicial.',
    },
  },
};
