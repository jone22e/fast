import type { PluginCatalog } from '../../types.js';

export const lgpd: PluginCatalog = {
  name: 'LGPD',
  description:
    'Conformidad observable con la LGPD (Ley General de Protección de Datos de Brasil): consentimiento antes del rastreo, cookies definidas sin autorización, política de privacidad, encargado (DPO) y formularios de recolección.',
  checks: {
    'consent-banner': 'Banner de consentimiento presente',
    cmp: 'Plataforma de consentimiento identificada',
    'no-tracking-before-consent': 'Sin rastreadores antes del consentimiento',
    'no-cookies-before-consent': 'Sin cookies no esenciales antes del consentimiento',
    'cookie-expiry': 'Cookies con plazo razonable',
    'third-party-cookies': 'Pocas cookies de terceros',
    'privacy-policy': 'Política de privacidad accesible',
    'policy-lgpd-terms': 'La política cita la LGPD y los derechos del titular',
    'dpo-contact': 'Encargado (DPO) identificado',
    terms: 'Términos de uso publicados',
    'form-notice': 'Formularios con aviso de privacidad',
    'form-method': 'Los datos personales no viajan en la URL',
    'form-https': 'Los formularios envían por HTTPS',
  },
  issues: {
    'lgpd-tracking-no-consent': {
      title: '{0} rastreador(es) cargado(s) sin consentimiento',
      description:
        'La página dispara rastreadores apenas se abre, sin pedir autorización y sin ofrecer la opción de rechazar. Como la auditoría no hizo clic en nada, esa carga ocurrió sin ninguna manifestación del visitante: la situación que la autoridad brasileña (ANPD) viene tratando como tratamiento de datos sin base legal adecuada. Cada rastreador envía a terceros la dirección visitada, la IP y un identificador persistente.',
      fix: 'Adopte una plataforma de consentimiento y mantenga las etiquetas bloqueadas hasta la elección del visitante. En Google Tag Manager, use el modo de consentimiento (Consent Mode v2) con todas las señales denegadas por defecto y dispare las etiquetas solo tras la aceptación. El banner debe permitir rechazar tan fácilmente como aceptar.',
      gain: 'Tratamiento de datos apoyado en un consentimiento válido y un riesgo de sanción sustancialmente menor.',
    },
    'lgpd-cookies-no-consent': {
      title: '{0} cookie(s) de rastreo definida(s) sin consentimiento',
      description:
        'Se grabaron cookies de analítica y publicidad en el navegador ya en el primer acceso, antes de cualquier elección. Las cookies estrictamente necesarias no requieren consentimiento; las de medición y marketing, sí.',
      fix: 'Clasifique cada cookie en necesaria, estadística y de marketing. Grabe solo las necesarias antes de la aceptación y condicione las demás a la categoría correspondiente en el banner. Documente la lista en la política de privacidad.',
      gain: 'Las cookies no esenciales pasan a depender de una elección informada, como exige la ley.',
    },
    'lgpd-no-consent-banner': {
      title: 'Sin mecanismo de consentimiento de cookies',
      description:
        'No se encontró un banner o panel que permita aceptar, rechazar o configurar el uso de cookies. Sin él no hay cómo demostrar el consentimiento ni atender una revocación, y demostrarlo es obligación del controlador.',
      fix: 'Implemente un banner con tres acciones con el mismo nivel de destaque: aceptar, rechazar y configurar. Guarde el registro de la elección (fecha, versión de la política y opciones) y ofrezca un enlace permanente para revisar la decisión.',
      gain: 'Pasa a existir prueba del consentimiento y un camino claro para revocarlo.',
    },
    'lgpd-no-privacy-policy': {
      title: 'Política de privacidad no encontrada',
      description:
        'No se localizó ningún enlace a una política o aviso de privacidad en las páginas analizadas. La LGPD exige informar de forma clara y accesible qué datos se tratan, con qué finalidad, con quién se comparten y por cuánto tiempo se conservan.',
      fix: 'Publique la política en una URL fija y enlácela en el pie de todas las páginas. Describa: datos recolectados, finalidad y base legal de cada tratamiento, compartición con terceros, plazo de retención, derechos del titular y cómo ejercerlos, además del contacto del encargado.',
      gain: 'La transparencia que exige la ley y un canal claro para que el titular ejerza sus derechos.',
    },
    'lgpd-policy-unreachable': {
      title: 'Política de privacidad inaccesible',
      description:
        'El enlace a la política existe, pero la página no respondió como se esperaba. Una política que no abre equivale, en la práctica, a no tener política.',
      fix: 'Corrija el destino del enlace y confirme que la página responde 200 sin exigir inicio de sesión.',
      gain: 'La política vuelve a cumplir su función de informar al titular.',
    },
    'lgpd-policy-incomplete': {
      title: 'Política de privacidad sin los elementos de la LGPD',
      description:
        'La política existe, pero no trae los elementos que la ley espera encontrar. Faltan referencias a: {0}. Un texto genérico traducido de otra jurisdicción suele dejar fuera justamente lo que la LGPD exige.',
      fix: 'Revise la política cubriendo cada punto: mención expresa a la Ley 13.709/2018, finalidad y base legal de cada tratamiento, derechos del titular (art. 18) y cómo ejercerlos, plazo de retención e identificación del encargado.',
      gain: 'Política alineada con lo que verifica la ANPD y menos exposición en una eventual fiscalización.',
    },
    'lgpd-no-dpo': {
      title: 'Encargado (DPO) no identificado',
      description:
        'No hay indicación de quién es el encargado del tratamiento de datos ni un canal para contactarlo. La LGPD (art. 41) determina que la identidad y el contacto del encargado se divulguen públicamente, y es por ese canal que el titular y la ANPD se comunican con la empresa.',
      fix: 'Publique en la política de privacidad el nombre (o el área responsable) y un correo de contacto del encargado, por ejemplo dpo@sudominio.com. Asegúrese de que alguien atienda ese buzón.',
      gain: 'Cumplimiento del art. 41 y un canal formal para las solicitudes de titulares.',
    },
    'lgpd-form-no-notice': {
      title: '{0} formulario(s) recolectan datos sin aviso de privacidad',
      description:
        'Hay formularios que piden datos personales sin ninguna casilla de consentimiento ni enlace a la política al lado. El titular necesita saber, en el momento de la recolección, para qué se usarán los datos.',
      fix: 'Agregue al formulario una frase corta con el enlace de la política ("Al enviar, usted acepta nuestra Política de Privacidad") y, cuando la base legal sea el consentimiento, una casilla desmarcada por defecto.',
      gain: 'Recolección informada y prueba de que se avisó al titular.',
    },
    'lgpd-form-get': {
      title: '{0} formulario(s) envían datos personales en la URL',
      description:
        'Un formulario con campos personales usa method="get": nombre, correo o documento terminan en la barra de direcciones, en el historial del navegador, en los logs del servidor y en la cabecera Referer enviada a terceros. Es una filtración de datos personales por diseño.',
      fix: 'Cambie el método del formulario a POST. Los datos personales nunca deben viajar en la query string.',
      gain: 'Los datos dejan de registrarse en logs e historiales fuera de su control.',
    },
    'lgpd-form-http': {
      title: 'Formulario de datos personales envía por HTTP',
      description:
        'El destino del formulario usa http://, así que los datos ingresados viajan en texto plano hasta el servidor. Cualquier intermediario de la red lee el contenido, y la LGPD exige medidas técnicas capaces de proteger los datos de accesos no autorizados.',
      fix: 'Apunte el action a una URL https:// y confirme que el destino no redirige a HTTP.',
      gain: 'Datos personales protegidos en tránsito, como exige la ley.',
    },
    'lgpd-cookie-long-lived': {
      title: '{0} cookie(s) con validez superior a 13 meses',
      description:
        'Las cookies no esenciales con un plazo muy largo mantienen identificado al visitante durante años sin una nueva manifestación. El principio de necesidad pide el menor plazo que aún cumpla la finalidad; 13 meses es la referencia práctica para renovar el consentimiento.',
      fix: 'Reduzca el max-age de las cookies de analítica y marketing a un máximo de 13 meses y vuelva a pedir consentimiento al expirar.',
      gain: 'Retención proporcional a la finalidad y consentimiento renovado periódicamente.',
    },
  },
};
