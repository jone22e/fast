import type { PluginCatalog } from '../../types.js';

export const infrastructure: PluginCatalog = {
  name: 'Infraestructura',
  description: 'Protocolo HTTP, compresión, caché, CDN, DNS, IPv6 y cadena de redirecciones.',
  checks: {
    http2: 'HTTP/2 disponible',
    http3: 'HTTP/3 (QUIC) disponible',
    'compression-html': 'HTML comprimido',
    brotli: 'Brotli habilitado',
    'cache-control': 'Cache-Control en el documento',
    validators: 'ETag o Last-Modified',
    'keep-alive': 'Conexiones persistentes',
    cdn: 'Distribución mediante CDN',
    dns: 'DNS resolviendo',
    ipv6: 'Soporte de IPv6',
    'dns-redundancy': 'Redundancia de direcciones',
    redirects: 'Sin cadena larga de redirecciones',
    status: 'Respuesta HTTP 200',
    'server-response': 'Tiempo de respuesta del servidor',
    console: 'Sin errores de JavaScript en la consola',
  },
  issues: {
    'infra-no-http2': {
      title: 'El servidor aparentemente usa HTTP/1.1',
      description:
        'HTTP/1.1 limita las solicitudes paralelas por conexión y no tiene multiplexación ni compresión de cabeceras, lo que retrasa las páginas con muchos recursos.',
      fix: 'Active HTTP/2 en el servidor web (en nginx: `listen 443 ssl; http2 on;`) o coloque un CDN delante, que ya entrega HTTP/2 y HTTP/3.',
      gain: 'Carga paralela más eficiente, sobre todo en páginas con muchos archivos.',
    },
    'infra-no-compression': {
      title: 'HTML servido sin compresión',
      description:
        'El documento principal viaja sin Gzip ni Brotli, normalmente entre 3 y 4 veces más grande de lo necesario.',
      fix: 'Active la compresión en el servidor. En nginx: `gzip on; gzip_types text/html text/css application/javascript application/json image/svg+xml;` y, si está disponible, el módulo brotli.',
      gain: 'Reducción del 60% al 80% en el peso de los archivos de texto.',
    },
    'infra-no-cache-control': {
      title: 'Documento HTML sin Cache-Control',
      description:
        'Sin una directiva explícita, cada navegador y proxy aplica su propia heurística de caché: el comportamiento se vuelve impredecible.',
      fix: 'Defina Cache-Control explícitamente. Para HTML dinámico: `no-cache` con ETag. Para HTML estático: `public, max-age=300, must-revalidate`.',
      gain: 'Comportamiento de caché predecible y revalidación eficiente.',
    },
    'infra-no-cdn': {
      title: 'Sin CDN detectado',
      description:
        'Sin una red de distribución, todos los visitantes buscan los archivos en el servidor de origen: los usuarios geográficamente distantes pagan la latencia completa.',
      fix: 'Coloque un CDN delante del sitio (Cloudflare, Fastly, CloudFront, Bunny). Además de la distribución, la mayoría entrega HTTP/3, Brotli y caché de borde automáticamente.',
      gain: 'TTFB sustancialmente menor para visitantes lejanos del servidor de origen.',
    },
    'infra-no-ipv6': {
      title: 'Dominio sin registro AAAA (IPv6)',
      description:
        'Una porción creciente de las redes móviles es solo IPv6 y depende de la traducción NAT64 para alcanzar servidores IPv4, lo que agrega latencia.',
      fix: 'Agregue un registro AAAA que apunte a la dirección IPv6 del servidor, o habilite IPv6 en el CDN.',
      gain: 'Conexión directa para los usuarios en redes IPv6.',
    },
    'infra-temp-redirect': {
      title: '{0} redirección(es) temporal(es) (302/307)',
      description:
        'Las redirecciones permanentes deben usar 301 o 308: con 302 los buscadores mantienen la URL antigua indexada y no transfieren autoridad.',
      fix: 'Cambie a 301 (o 308, que preserva el método HTTP) las redirecciones que son definitivas.',
      gain: 'Transferencia correcta de autoridad a la URL final.',
    },
    'infra-bad-status': {
      title: 'La página respondió HTTP {0}',
      description:
        'La URL no devuelve 200 OK: los buscadores no indexarán el contenido y los usuarios pueden ver una página de error.',
      fix: 'Revise la configuración del servidor y de la aplicación para que la URL responda 200 con el contenido esperado.',
      gain: 'Página accesible e indexable.',
    },
    'infra-console-errors': {
      title: '{0} error(es) de JavaScript durante la carga',
      description:
        'Los errores en consola indican funcionalidades rotas: formularios, seguimiento y componentes interactivos pueden no estar funcionando.',
      fix: 'Abra las DevTools, reproduzca los errores listados y corrija el origen de cada uno.',
      gain: 'Funcionalidades restauradas y menos comportamiento impredecible.',
    },
  },
};
