import type { PluginCatalog } from '../../types.js';

export const ux: PluginCatalog = {
  name: 'UX',
  description:
    'Consistencia visual, navegación, jerarquía, CTA, formularios y tiempo hasta la interactividad.',
  checks: {
    typography: 'Consistencia tipográfica',
    'color-palette': 'Paleta de colores contenida',
    nav: 'Navegación principal presente',
    'internal-nav': 'Enlaces internos suficientes',
    hierarchy: 'Jerarquía visual clara',
    cta: 'Llamadas a la acción identificables',
    'cta-quality': 'CTA con texto descriptivo',
    'forms-submit': 'Formularios con botón de envío',
    'forms-length': 'Formularios de longitud razonable',
    interactivity: 'Tiempo hasta que la página responde',
    inp: 'Respuesta a la interacción (INP)',
    clickable: 'Elementos interactivos presentes',
    footer: 'Pie de página estructurado',
  },
  issues: {
    'ux-too-many-fonts': {
      title: '{0} familias tipográficas distintas',
      description:
        'Demasiadas fuentes fragmentan la identidad visual y aumentan el peso de la página, ya que cada familia exige descargar sus propios archivos.',
      fix: 'Reduzca a 2 familias (una para títulos y otra para el cuerpo) y use distintos pesos de la misma familia para crear variación.',
      gain: 'Identidad visual más cohesionada y menos bytes de fuentes.',
    },
    'ux-no-nav': {
      title: 'Sin elemento de navegación <nav>',
      description:
        'No se identificó una navegación principal marcada semánticamente, lo que dificulta la orientación del usuario y la comprensión de la estructura del sitio.',
      fix: 'Envuelva el menú principal en <nav> y agregue aria-label cuando haya más de un bloque de navegación.',
      gain: 'Estructura de navegación clara para usuarios y para la tecnología asistiva.',
    },
    'ux-no-cta': {
      title: 'Ninguna llamada a la acción identificada',
      description:
        'La página no presenta botones ni enlaces de acción evidentes: el usuario llega, lee y no sabe cuál es el siguiente paso.',
      fix: 'Agregue una CTA principal visible en el primer pliegue, con un verbo de acción claro ("Empezar ahora", "Solicitar demostración") y contraste destacado.',
      gain: 'Aumento directo en la tasa de conversión.',
    },
    'ux-form-no-submit': {
      title: '{0} formulario(s) sin botón de envío visible',
      description:
        'Los formularios que dependen solo de la tecla Enter dejan a parte de los usuarios sin saber cómo concluir.',
      fix: 'Agregue un <button type="submit"> explícito a cada formulario.',
      gain: 'Menos abandonos durante el llenado.',
    },
    'ux-long-forms': {
      title: '{0} formulario(s) con más de 7 campos',
      description:
        'El mayor tiene {0} campos. Cada campo adicional reduce de forma medible la tasa de finalización.',
      fix: 'Reduzca a los campos realmente necesarios, agrupe el resto en pasos y recoja los datos complementarios después de la conversión inicial.',
      gain: 'Aumento típico del 10% al 25% en la finalización del formulario.',
    },
    'ux-slow-interaction': {
      title: 'La página queda {0} sin responder durante la carga',
      description:
        'Los clics realizados en esa ventana se encolan o se pierden, y el usuario percibe la interfaz como congelada.',
      fix: 'Aplace los scripts no esenciales, divida las tareas largas en bloques con scheduler.yield() o setTimeout, e hidrate los componentes bajo demanda.',
      gain: 'Interfaz receptiva desde el primer instante visible.',
    },
  },
};
