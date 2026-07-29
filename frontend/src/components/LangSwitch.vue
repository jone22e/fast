<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import Icon from './Icon.vue';
import { useI18n } from '@/i18n';
import type { Lang } from '@/i18n';

/**
 * Seletor de idioma.
 *
 * Um <select> nativo seria menos código, mas o menu abaixo permite mostrar o
 * nome de cada idioma na própria língua — que é como alguém que não lê a
 * língua atual encontra a sua.
 */
const { lang, t, langs, langName, setLang } = useI18n();

const open = ref(false);

function choose(next: Lang): void {
  setLang(next);
  open.value = false;
}

function onKey(event: KeyboardEvent): void {
  if (event.key === 'Escape') open.value = false;
}

function onClickOutside(event: MouseEvent): void {
  const target = event.target as HTMLElement | null;
  if (!target?.closest('.lang')) open.value = false;
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', onKey);
  window.addEventListener('click', onClickOutside);
}

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey);
  window.removeEventListener('click', onClickOutside);
});
</script>

<template>
  <div class="lang">
    <button
      class="trigger"
      :aria-label="t.nav.language"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click.stop="open = !open"
    >
      <Icon name="globe" :size="16" />
      <span class="code">{{ lang.toUpperCase() }}</span>
    </button>

    <ul v-if="open" class="menu" role="listbox" :aria-label="t.nav.language">
      <li v-for="option in langs" :key="option">
        <button
          role="option"
          :aria-selected="option === lang"
          :class="{ active: option === lang }"
          @click="choose(option)"
        >
          {{ langName(option) }}
          <Icon v-if="option === lang" name="check" :size="14" />
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.lang {
  position: relative;
}

.trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 11px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.trigger:hover {
  color: var(--text);
  border-color: var(--border-strong);
  background: var(--bg-card);
}

.code {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 30;
  min-width: 160px;
  margin: 0;
  padding: 5px;
  list-style: none;
  background: var(--bg-card);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow);
  animation: fade-up 0.15s ease both;
}

.menu button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  min-height: 38px;
  padding: 0 11px;
  border-radius: 6px;
  font-size: 13.5px;
  color: var(--text-muted);
  text-align: left;
  transition: background 0.12s, color 0.12s;
}

.menu button:hover {
  background: var(--bg-hover);
  color: var(--text);
}

.menu button.active {
  color: var(--accent);
}
</style>
