import type { PluginCatalog } from '../../types.js';

export const protection: PluginCatalog = {
  name: 'Protección y exposición',
  description:
    'Evaluación pasiva de la postura de seguridad: WAF/firewall, exposición de la IP externa de origen, filtración de claves y contraseñas en el código servido, susceptibilidad a inyección SQL, transporte de contraseñas y política de divulgación.',
  checks: {
    waf: 'WAF / firewall de aplicaciones',
    'origin-protected': 'IP de origen oculta detrás de CDN/proxy',
    'no-internal-ip-leak': 'Sin filtración de IP interna',
    'version-disclosure': 'Sin divulgación de versión/tecnología',
    'sql-error-leak': 'Sin filtración de errores de base de datos',
    'no-stacktrace': 'Sin stack traces expuestos',
    'param-surface': 'Superficie de parámetros controlada',
    'no-exposed-files': 'Sin archivos sensibles accesibles',
    'no-exposed-secrets': 'Sin claves/secretos en el código servido',
    'password-transport': 'Transporte seguro de contraseñas',
    'security-txt': 'security.txt (política de divulgación)',
    'no-autoindex': 'Listado de directorios deshabilitado',
  },
  issues: {
    'prot-no-waf': {
      gain: 'Bloqueo automático de la mayoría de los ataques conocidos (OWASP Top 10) antes de que lleguen al servidor.',
    },
    'prot-origin-exposed': {
      title: 'IP externa de origen expuesta ({0})',
      description:
        'Las direcciones {0} responden por este host y no pertenecen a ninguna red de CDN conocida: es decir, es el propio servidor de origen, alcanzable directamente desde internet. Sin un borde (Cloudflare, CloudFront, Fastly) delante, un atacante apunta directo a la IP: denegación de servicio volumétrica (DDoS), escaneo de puertos y ataques que evitan cualquier protección basada en DNS. Route53 por sí solo no resuelve esto: es únicamente DNS y sigue publicando la IP real; hace falta un proxy que reciba el tráfico en lugar del origen.',
      fix: 'Paso a paso: (1) coloque delante un proxy inverso que oculte el origen: Cloudflare (proxy naranja activado) o CloudFront/Fastly; (2) cambie el registro DNS para que apunte al proxy y no a la IP del servidor; (3) reconfigure el firewall de la máquina (ufw/iptables/Security Group) para aceptar los puertos 80 y 443 SOLO desde los rangos de IP del CDN y rechazar el resto, de modo que ni quien descubra la IP antigua alcance el origen; (4) si es posible, cambie la IP pública del servidor tras la migración, para invalidar los registros históricos que ya filtraron la dirección.',
      gain: 'La IP de origen deja de ser alcanzable directamente; los ataques volumétricos se absorben en el borde y no tumban el servidor.',
    },
    'prot-internal-ip-leak': {
      title: 'Dirección IP interna expuesta',
      description:
        'Una dirección de red interna aparece en las cabeceras de respuesta o en el HTML. Eso revela la topología de la infraestructura (proxies, balanceadores, servidores de aplicación) y facilita el mapeo del entorno por parte de un atacante.',
      fix: 'Elimine las cabeceras que exponen IPs internas (X-Backend-Server, X-Real-IP, Via) en la configuración del proxy inverso, y quite las IPs internas de comentarios y páginas de error.',
      gain: 'Menos información sobre la topología interna disponible para un atacante.',
    },
    'prot-tech-disclosure': {
      title: 'El servidor divulga versión y tecnología',
      description:
        'Las cabeceras y los metadatos revelan el stack y las versiones en uso. Un atacante usa exactamente esa información para elegir exploits conocidos que afectan a esa versión específica: es el primer paso de cualquier escaneo automatizado.',
      fix: 'Oculte las versiones: en nginx use `server_tokens off;`; en Apache `ServerTokens Prod` y `ServerSignature Off`; elimine la cabecera X-Powered-By en la aplicación (en Express, `app.disable("x-powered-by")`); y quite la meta generator con la versión.',
      gain: 'Los ataques automatizados por versión pierden el objetivo; la superficie se vuelve opaca.',
    },
    'prot-sql-error-leak': {
      title: 'Errores de base de datos expuestos ({0})',
      description:
        'La página muestra mensajes de error crudos de la base de datos. Es una señal fuerte de susceptibilidad a inyección SQL: además de revelar la estructura de tablas y consultas, indica que la entrada del usuario llega a la base sin tratamiento y que los errores no se capturan. Es exactamente la respuesta que un atacante busca para confirmar y explotar una inyección.',
      fix: 'Dos frentes: (1) use siempre consultas parametrizadas / prepared statements, nunca concatene entrada del usuario en SQL; (2) capture las excepciones de base de datos y muestre una página de error genérica, registrando el detalle solo en el log del servidor. En producción, desactive la visualización de errores (por ejemplo `display_errors = Off` en PHP).',
      gain: 'Cierra el principal vector de exfiltración de datos y deja de entregarle el mapa de la base al atacante.',
    },
    'prot-stacktrace': {
      title: 'Stack trace de la aplicación expuesto',
      description:
        'La página revela un rastreo de pila (stack trace). Expone rutas de archivos, nombres de funciones internas, bibliotecas y versiones: información valiosa para que un atacante arme la explotación, y una señal de que el manejo de errores está desactivado o mal configurado.',
      fix: 'Desactive la salida detallada de errores en producción y configure una página de error 500 genérica. Registre el detalle solo en el log del servidor.',
      gain: 'Elimina la filtración de detalles internos de la aplicación.',
    },
    'prot-exposed-file': {
      title: 'Archivo sensible accesible públicamente: {0}',
      description:
        'Uno o más archivos que nunca deberían ser públicos responden directamente por la web. Archivos como .env, .git, volcados de base de datos o copias de configuración entregan credenciales, claves de API, cadenas de conexión — y, en el caso de .git, el código fuente completo del sitio. Cualquier visitante o robot que pida la URL recibe el contenido; es una de las exposiciones más buscadas por los escáneres automatizados.',
      fix: 'Paso a paso: (1) bloquee el acceso a esas rutas en el servidor — en nginx, `location ~ /\\.(?!well-known) { deny all; }` cubre archivos ocultos como .env y .git; agregue reglas que nieguen *.sql, *.bak, *.old y *.save; (2) saque volcados y copias del directorio público (nunca deben estar en el docroot); (3) si se sirvió un .env, clave o credencial, trátelo como COMPROMETIDO: revóquelo y genere nuevas credenciales; (4) si .git quedó expuesto, todo el historial pudo ser clonado — rote cualquier secreto que haya pasado por el repositorio.',
      gain: 'Cierra el acceso directo a credenciales, código fuente y datos — la exposición de mayor impacto y más fácil de explotar.',
    },
    'prot-exposed-secret': {
      title: 'Secreto expuesto en el código: {0}',
      description:
        'Una o más claves/tokens aparecen en el HTML o en los scripts entregados al navegador. Cualquier visitante —y cualquier bot— puede leerlos abriendo el código fuente de la página. Una clave filtrada permite el acceso indebido a los servicios que autentica (nube, pasarela de pago, repositorio), muchas veces con un costo financiero directo.',
      fix: 'Paso a paso: (1) REVOQUE la clave de inmediato en el proveedor: considérela comprometida, porque ya fue servida públicamente; (2) genere una nueva y manténgala solo en el servidor (variable de entorno), nunca en el código del frontend; (3) mueva al backend la llamada que usa la clave, exponiendo al navegador solo un endpoint propio; (4) si es una clave que sí debe llegar al cliente (por ejemplo, Google Maps), restrínjala por dominio/HTTP referer y por API en el panel del proveedor.',
      gain: 'Cierra el acceso indebido a los servicios autenticados por la clave y elimina el riesgo de costos por uso malicioso.',
    },
    'prot-hardcoded-password': {
      title: 'Posible contraseña/secreto hardcodeado en el código ({0})',
      description:
        'Se encontraron asignaciones que parecen contraseñas o secretos incrustados en el HTML/JS servido. Puede haber falsos positivos (valores de ejemplo), pero cada aparición merece una revisión manual: las credenciales en el código del frontend quedan visibles para cualquier visitante.',
      fix: 'Revise cada aparición. Si es una credencial real, revóquela y muévala al servidor. Nunca versione contraseñas en el código; use variables de entorno y un gestor de secretos.',
      gain: 'Elimina las credenciales legibles en el código entregado al navegador.',
    },
    'prot-password-http': {
      title: 'Campo de contraseña en una página sin HTTPS',
      description:
        'La página tiene un campo de contraseña pero no se sirve por HTTPS. La contraseña escrita viaja en texto plano y puede ser leída por cualquier intermediario de la red (wifi público, proveedor, proxy). Es una filtración directa de credenciales.',
      fix: "Sirva la página por HTTPS y redirija todo HTTP a HTTPS. Un certificado gratuito (Let's Encrypt) lo resuelve. Nunca recoja contraseñas en una página HTTP.",
      gain: 'Las credenciales dejan de viajar en texto plano.',
    },
    'prot-password-get': {
      title: 'Formulario de contraseña enviando por GET',
      description:
        'Un formulario con campo de contraseña usa method="get". La contraseña termina en la URL: queda registrada en el historial del navegador, en los logs del servidor y del proxy, y en la cabecera Referer enviada a terceros. Es una filtración de credenciales.',
      fix: 'Cambie el método del formulario a POST. Las contraseñas y los datos sensibles nunca deben ir en la query string.',
      gain: 'La contraseña deja de filtrarse en URLs, logs y cabeceras Referer.',
    },
    'prot-password-action-http': {
      title: 'Formulario de contraseña envía a un destino HTTP',
      description:
        'La página es HTTPS, pero el formulario de inicio de sesión envía los datos a una URL http://: la protección se anula en el envío y la contraseña viaja en texto plano hasta el destino.',
      fix: 'Apunte el action del formulario a una URL https://. Verifique también que no haya redirecciones en el destino que degraden a HTTP.',
      gain: 'Credenciales protegidas en todo el trayecto hasta el servidor.',
    },
    'prot-no-security-txt': {
      title: 'Sin security.txt (canal de divulgación de vulnerabilidades)',
      description:
        'No existe /.well-known/security.txt. Sin un canal claro, quien descubre una falla en su sitio no sabe cómo avisar, y una vulnerabilidad que podría corregirse discretamente termina convirtiéndose en un incidente público o se vende.',
      fix: 'Cree /.well-known/security.txt (RFC 9116) con al menos: una línea "Contact: mailto:security@sudominio.com" y una "Expires:" con fecha futura. Opcionalmente agregue "Policy:" apuntando a su política de divulgación.',
      gain: 'Los investigadores pasan a tener un camino para reportar fallas de forma responsable.',
    },
    'prot-autoindex': {
      title: 'Listado de directorios habilitado',
      description:
        'El servidor muestra el contenido de los directorios sin página de índice. Eso expone archivos que no deberían ser navegables —copias de seguridad, configuraciones, subidas— y le da al atacante un mapa de los archivos del servidor.',
      fix: 'Desactive el listado automático (en nginx, `autoindex off;`, que ya es el valor por defecto; en Apache, elimine `Options +Indexes`).',
      gain: 'Los archivos dejan de ser navegables sin un enlace explícito.',
    },
  },
};
