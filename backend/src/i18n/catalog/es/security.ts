import type { PluginCatalog } from '../../types.js';

export const security: PluginCatalog = {
  name: 'Seguridad',
  description: 'HTTPS, certificado, cabeceras de seguridad, política de cookies y contenido mixto.',
  checks: {
    https: 'HTTPS habilitado',
    'cert-valid': 'Certificado de confianza',
    'cert-expiry': 'Certificado lejos del vencimiento',
    hsts: 'Strict-Transport-Security',
    csp: 'Content-Security-Policy',
    xfo: 'Protección contra clickjacking',
    xcto: 'X-Content-Type-Options: nosniff',
    referrer: 'Referrer-Policy',
    permissions: 'Permissions-Policy',
    'cookie-secure': 'Cookies con la marca Secure',
    'cookie-httponly': 'Cookies con HttpOnly',
    'cookie-samesite': 'Cookies con SameSite',
    'mixed-content': 'Sin contenido mixto',
    'version-disclosure': 'Sin exposición de la versión del servidor',
  },
  issues: {
    'sec-no-https': {
      title: 'Sitio servido sin HTTPS',
      description:
        'Todo el tráfico viaja en texto plano y puede ser leído y alterado por cualquier intermediario. Los navegadores marcan la página como "No seguro" y los buscadores penalizan el posicionamiento.',
      fix: "Emita un certificado (Let's Encrypt es gratuito), configure el servidor para HTTPS y redirija todo el tráfico HTTP a HTTPS con un 301.",
      gain: 'Protección de los datos, eliminación del aviso de "No seguro" y recuperación de posiciones en el posicionamiento.',
    },
    'sec-invalid-cert': {
      title: 'Certificado TLS inválido o no confiable',
      description:
        'El navegador muestra un aviso de seguridad a pantalla completa antes de permitir el acceso, lo que hace que la mayoría de los visitantes abandone el sitio.',
      fix: 'Verifique que la cadena de certificación intermedia esté completa y que el certificado cubra el dominio accedido (incluido el subdominio www, si se usa).',
      gain: 'Acceso sin avisos de seguridad.',
    },
    'sec-cert-expiring': {
      title: 'El certificado expira en {0} día(s)',
      description: 'Tras el vencimiento, todos los visitantes reciben un error de seguridad bloqueante.',
      fix: 'Renueve el certificado y configure la renovación automática (certbot renew mediante un temporizador de systemd o cron).',
      gain: 'Elimina el riesgo de indisponibilidad por certificado vencido.',
    },
    'sec-no-hsts': {
      title: 'Cabecera HSTS ausente',
      description:
        'Sin HSTS, la primera visita puede ser interceptada y degradada a HTTP antes de que ocurra la redirección.',
      fix: 'Agregue: Strict-Transport-Security: max-age=31536000; includeSubDomains. Active includeSubDomains solo si todos los subdominios ya usan HTTPS.',
      gain: 'El navegador pasa a forzar HTTPS sin esperar la redirección.',
    },
    'sec-no-csp': {
      title: 'Sin Content-Security-Policy',
      description:
        'La CSP es la principal defensa contra XSS: declara desde qué orígenes pueden cargarse scripts, estilos e imágenes. Sin ella, cualquier script inyectado se ejecuta libremente.',
      fix: "Empiece con Content-Security-Policy-Report-Only para mapear los orígenes legítimos y luego aplíquela en modo bloqueo. Una base razonable: default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'.",
      gain: 'Mitigación de la clase más común de vulnerabilidad web.',
    },
    'sec-weak-csp': {
      title: 'Content-Security-Policy demasiado permisiva',
      description:
        'La política contiene unsafe-inline, unsafe-eval o comodines, lo que anula gran parte de la protección contra XSS.',
      fix: 'Sustituya unsafe-inline por nonces o hashes por script, y elimine unsafe-eval refactorizando el código que usa eval() o new Function().',
      gain: 'Una CSP que realmente bloquea la inyección de scripts.',
    },
    'sec-no-xfo': {
      title: 'Sin protección contra clickjacking',
      description:
        'La página puede incrustarse en un iframe de un sitio de terceros y cubrirse con elementos invisibles para capturar los clics del usuario.',
      fix: "Agregue X-Frame-Options: SAMEORIGIN y, preferentemente, también frame-ancestors 'self' en la CSP.",
      gain: 'Elimina el vector de clickjacking.',
    },
    'sec-missing-headers': {
      title: '{0} cabeceras de seguridad ausentes',
      description:
        'Faltan: {0}. Son protecciones de bajo costo contra el sniffing de MIME, la fuga de referrer y el uso indebido de las API del navegador.',
      fix: 'Agregue en el servidor: X-Content-Type-Options: nosniff; Referrer-Policy: strict-origin-when-cross-origin; Permissions-Policy: geolocation=(), microphone=(), camera=().',
      gain: 'Superficie de ataque reducida con un solo cambio de configuración.',
    },
    'sec-insecure-cookies': {
      title: '{0} cookie(s) sin la marca Secure',
      description:
        'Las cookies sin Secure también se envían por conexiones HTTP, lo que expone las sesiones a interceptación.',
      fix: 'Defina las cookies con las marcas Secure, HttpOnly y SameSite=Lax (o Strict cuando no haya navegación cross-site legítima).',
      gain: 'Sesiones protegidas contra interceptación y robo por script.',
    },
    'sec-mixed-content': {
      title: '{0} recurso(s) cargado(s) por HTTP en una página HTTPS',
      description:
        'Los navegadores bloquean scripts y hojas de estilo por HTTP dentro de páginas HTTPS y marcan la conexión como parcialmente insegura. Los recursos pueden simplemente no cargar.',
      fix: 'Cambie todas las URLs http:// por https:// (o por rutas relativas al protocolo). Agregue upgrade-insecure-requests a la CSP como red de seguridad.',
      gain: 'Conexión totalmente segura y todos los recursos cargando correctamente.',
    },
  },
};
