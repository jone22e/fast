import type { PluginCatalog } from '../../types.js';

export const mobile: PluginCatalog = {
  name: 'Móvil',
  description:
    'Viewport, responsividad, tamaños de fuente y de objetivos táctiles, CLS móvil e imágenes responsivas.',
  checks: {
    viewport: 'Meta viewport configurada',
    zoom: 'Zoom permitido',
    'no-overflow': 'Sin desplazamiento horizontal',
    'font-size': 'Fuentes legibles (≥ 12px)',
    'tap-targets': 'Objetivos táctiles de al menos 44×44px',
    'mobile-lcp': 'LCP en móvil',
    'mobile-cls': 'CLS en móvil',
    'responsive-images': 'Imágenes con srcset',
  },
  issues: {
    'mobile-no-viewport': {
      description:
        'Sin width=device-width, el navegador móvil renderiza la página con ancho de escritorio (980px) y lo reduce todo proporcionalmente, dejando el texto ilegible.',
      fix: 'Agregue en el <head>: <meta name="viewport" content="width=device-width, initial-scale=1">',
      gain: 'Renderizado correcto en dispositivos móviles: requisito previo para cualquier optimización móvil.',
    },
    'mobile-zoom-blocked': {
      title: 'Zoom deshabilitado en el viewport',
      description:
        'Impedir el zoom bloquea una función de accesibilidad esencial para las personas con baja visión.',
      fix: 'Elimine user-scalable=no y maximum-scale=1 de la meta viewport.',
      gain: 'Conformidad con WCAG 1.4.4 (redimensionamiento del texto).',
    },
    'mobile-horizontal-scroll': {
      title: 'La página tiene desplazamiento horizontal en móvil',
      description:
        '{0} elemento(s) superan el ancho de pantalla de {1}px, lo que obliga al usuario a desplazarse lateralmente para leer el contenido.',
      fix: 'Identifique los elementos listados y aplique max-width: 100%, box-sizing: border-box y width: auto. Las tablas y los bloques de código deben ir en su propio contenedor con overflow-x: auto.',
      gain: 'Lectura cómoda en cualquier ancho de pantalla.',
    },
    'mobile-small-fonts': {
      title: '{0} elemento(s) con fuente menor a 12px',
      description:
        'Los textos muy pequeños obligan al usuario a hacer zoom para leer, lo que casi siempre termina en el abandono de la página.',
      fix: 'Use como mínimo 16px para el cuerpo del texto y 14px para los textos auxiliares. Prefiera unidades relativas (rem) a píxeles fijos.',
      gain: 'Lectura sin zoom y menor tasa de rebote en móvil.',
    },
    'mobile-small-tap-targets': {
      title: '{0} objetivo(s) táctil(es) menor(es) que 44×44px',
      description:
        'Los enlaces y botones pequeños provocan toques erróneos. La recomendación de 44×44 px proviene del tamaño medio de la yema del dedo de un adulto.',
      fix: 'Aumente el padding de los elementos interactivos hasta un área clicable de 44×44px y deje al menos 8px de separación entre objetivos adyacentes.',
      gain: 'Menos toques erróneos y navegación más fluida en el móvil.',
    },
    'mobile-cls-regression': {
      title: 'Diseño mucho más inestable en móvil (CLS {0} frente a {1} en escritorio)',
      description:
        'El desplazamiento de diseño es notablemente peor en el móvil, lo que sugiere elementos que se reajustan solo en pantallas estrechas.',
      fix: 'Reserve altura para banners, carruseles y anuncios en los breakpoints móviles, y declare las dimensiones de todas las imágenes.',
      gain: 'CLS móvil dentro del rango bueno y menos clics accidentales.',
    },
    'mobile-no-srcset': {
      title: 'Imágenes sin variantes responsivas',
      description:
        '{0} de {1} imágenes se sirven en un tamaño único. En el móvil, eso significa descargar la versión de escritorio en una pantalla de 390px.',
      fix: 'Genere variantes en varios anchos y use srcset con sizes, o <picture> con <source media> por breakpoint.',
      gain: 'Reducción típica del 50% al 70% en el peso de las imágenes en dispositivos móviles.',
    },
  },
};
