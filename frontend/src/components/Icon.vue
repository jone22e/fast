<script setup lang="ts">
/**
 * Conjunto de ícones da interface — traçado único, grade de 24×24.
 *
 * São desenhados inline (e não como fonte ou sprite externo) por três motivos:
 * herdam `currentColor`, não custam uma requisição a mais e não entram em
 * conflito com a CSP `img-src 'self'`.
 */
const ICONS: Record<string, string> = {
  // ---- módulos de auditoria ----
  performance: 'M12 14l4-4M4.5 18a9 9 0 1 1 15 0',
  seo: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM15.5 15.5 20 20',
  geo: 'M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3ZM18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8L18 16Z',
  content: 'M6 3h8l4 4v14H6V3ZM14 3v4h4M9 12h6M9 16h6',
  accessibility: 'M12 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM5 8.5l7 1.5 7-1.5M12 10v4m0 0-2.5 7M12 14l2.5 7',
  security: 'M12 3l7 3v5.5c0 4.3-2.9 8.1-7 9.5-4.1-1.4-7-5.2-7-9.5V6l7-3ZM9 12l2 2 4-4',
  protection: 'M12 3l7 3v5.5c0 4.3-2.9 8.1-7 9.5-4.1-1.4-7-5.2-7-9.5V6l7-3ZM12 9.5v.01M12 12.5v3',
  infrastructure: 'M4 5h16v5H4V5ZM4 14h16v5H4v-5ZM7.5 7.5v.01M7.5 16.5v.01',
  mobile: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM11 18h2',
  ux: 'M4 5h16v11H4V5ZM4 9h16M9 20h6M12 16v4',
  // LGPD: escudo com documento — proteção aplicada a dado pessoal.
  lgpd: 'M12 3l6.5 2.6v5c0 4-2.6 7.5-6.5 8.8-3.9-1.3-6.5-4.8-6.5-8.8v-5L12 3ZM9.5 9.5h5M9.5 12.5h5M9.5 15.5h3',

  // ---- interface ----
  bolt: 'M13 3 5 14h6l-1 7 8-11h-6l1-7Z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  check: 'M4.5 12.5 9 17l10.5-10.5',
  chart: 'M4 20h16M7.5 20v-6M12 20V6m4.5 14v-9',
  ai: 'M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3ZM18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8L18 16Z',
  shield: 'M12 3l7 3v5.5c0 4.3-2.9 8.1-7 9.5-4.1-1.4-7-5.2-7-9.5V6l7-3Z',
  link: 'M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.2 1.2M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1.2-1.2',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5v-15ZM4 20.5A2.5 2.5 0 0 1 6.5 18H19v3H6.5A2.5 2.5 0 0 1 4 20.5Z',
  layers: 'M12 3l8 4.5-8 4.5-8-4.5L12 3ZM4 12l8 4.5 8-4.5M4 16.5 12 21l8-4.5',
  arrowDown: 'M12 5v13m0 0-5-5m5 5 5-5',
  arrowRight: 'M5 12h13m0 0-5-5m5 5-5 5',
  download: 'M12 4v10m0 0-4-4m4 4 4-4M5 18v2h14v-2',
  eye: 'M2.8 12S6.5 5.5 12 5.5 21.2 12 21.2 12 17.5 18.5 12 18.5 2.8 12 2.8 12ZM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  alert: 'M12 3.5 21 20H3l9-16.5ZM12 10v4m0 3v.01',
  refresh: 'M4 12a8 8 0 0 1 13.7-5.6L20 8M20 4v4h-4M20 12a8 8 0 0 1-13.7 5.6L4 16M4 20v-4h4',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3.5 9h17M3.5 15h17M12 3c-2.2 2.4-3.3 5.4-3.3 9s1.1 6.6 3.3 9c2.2-2.4 3.3-5.4 3.3-9S14.2 5.4 12 3Z',
  filter: 'M4 6h16M7 12h10M10 18h4',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
};

defineProps<{ name: keyof typeof ICONS | string; size?: number }>();
</script>

<template>
  <svg
    class="icon"
    :width="size ?? 20"
    :height="size ?? 20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="ICONS[name] ?? ICONS.check" />
  </svg>
</template>

<style scoped>
.icon {
  display: block;
  flex-shrink: 0;
}
</style>
