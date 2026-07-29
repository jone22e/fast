import type { PluginCatalog } from '../../types.js';

export const accessibility: PluginCatalog = {
  name: 'Accesibilidad',
  description:
    'Contraste, textos alternativos, etiquetas de formulario, navegación por teclado y marcos semánticos.',
  checks: {
    alt: 'Imágenes con atributo alt',
    'alt-quality': 'Alt descriptivo (no genérico)',
    labels: 'Campos de formulario etiquetados',
    contrast: 'Contraste de texto según WCAG AA',
    aria: 'Uso de atributos ARIA',
    tabindex: 'Sin tabindex positivo',
    landmarks: 'Marcos de navegación (header/nav/main/footer)',
    lang: 'Idioma declarado',
    focusable: 'Elementos enfocables presentes',
    'link-text': 'Enlaces con texto descriptivo',
    'link-text-quality': 'Textos de enlace específicos',
  },
  issues: {
    'a11y-missing-alt': {
      title: '{0} imagen(es) sin atributo alt',
      description:
        'Los lectores de pantalla anuncian el nombre del archivo cuando no hay alt, lo que hace la información inaccesible. Es también el texto que se muestra cuando la imagen no carga.',
      fix: 'Agregue un alt descriptivo a cada imagen informativa. Para las imágenes puramente decorativas, use alt="" (vacío, pero presente) para que el lector de pantalla las ignore.',
      gain: 'Conformidad con WCAG 1.1.1 y contenido accesible para usuarios de lectores de pantalla.',
    },
    'a11y-unlabeled-inputs': {
      title: '{0} campo(s) de formulario sin etiqueta',
      description:
        'Sin un <label> asociado (o aria-label), el usuario de lector de pantalla no sabe qué debe completar. Es una de las fallas de accesibilidad más bloqueantes.',
      fix: 'Asocie cada campo a un <label for="id-del-campo">. Cuando no se desee una etiqueta visible, use aria-label en el campo.',
      gain: 'Formularios utilizables con lectores de pantalla y conformidad con WCAG 3.3.2.',
    },
    'a11y-contrast': {
      title: '{0} elemento(s) con contraste insuficiente',
      description:
        'El peor caso tiene una razón de {0}:1, por debajo del mínimo de 4,5:1 que exige WCAG AA para texto normal. Afecta la lectura en pantallas con brillo, bajo el sol y a personas con baja visión.',
      fix: 'Oscurezca el color del texto o aclare el fondo hasta alcanzar 4,5:1 (3:1 para texto grande o en negrita por encima de 18,66px). Verifique con un comprobador de contraste.',
      gain: 'Lectura cómoda para todos los usuarios y conformidad con WCAG 1.4.3.',
    },
    'a11y-positive-tabindex': {
      title: '{0} elemento(s) con tabindex positivo',
      description:
        'Un tabindex mayor que cero fuerza un orden de tabulación artificial que casi siempre difiere del orden visual y confunde a quien navega con teclado.',
      fix: 'Use tabindex="0" para hacer los elementos enfocables en el orden natural, o "-1" para sacarlos de la tabulación. Ajuste el orden en el DOM, no en el tabindex.',
      gain: 'Navegación por teclado previsible.',
    },
    'a11y-no-main-landmark': {
      title: 'Sin marco <main>',
      description:
        'Los usuarios de lectores de pantalla usan el marco principal para saltar la navegación e ir directo al contenido. Sin él, deben tabular por todo el menú en cada página.',
      fix: 'Envuelva el contenido principal en <main> y agregue arriba un enlace "saltar al contenido" que apunte a él.',
      gain: 'Navegación mucho más rápida para usuarios de tecnología asistiva.',
    },
    'a11y-no-lang': {
      title: 'Idioma de la página no declarado',
      description:
        'Sin lang, el lector de pantalla usa la voz predeterminada del sistema y puede pronunciar el contenido con la fonética equivocada.',
      fix: 'Agregue lang="es" (o el idioma correcto) en la etiqueta <html>.',
      gain: 'Pronunciación correcta en lectores de pantalla (WCAG 3.1.1).',
    },
    'a11y-empty-links': {
      title: '{0} enlace(s) sin texto accesible',
      description:
        'Los enlaces que solo contienen iconos o imágenes sin alt son anunciados como "enlace" por el lector de pantalla, sin ninguna indicación del destino.',
      fix: 'Agregue aria-label al enlace, o un alt descriptivo a la imagen interna, o texto oculto visualmente con una clase sr-only.',
      gain: 'Todos los enlaces pasan a ser comprensibles fuera del contexto visual.',
    },
  },
};
