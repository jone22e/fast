<script setup lang="ts">
import { computed } from 'vue';
import { scoreColor } from '@/utils';

const props = withDefaults(
  defineProps<{ score: number; size?: number; stroke?: number; label?: string }>(),
  { size: 160, stroke: 10 },
);

const radius = computed(() => (props.size - props.stroke) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const offset = computed(() => circumference.value * (1 - Math.min(100, Math.max(0, props.score)) / 100));
const color = computed(() => scoreColor(props.score));
</script>

<template>
  <div class="ring" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" aria-hidden="true">
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        stroke="var(--border)"
        :stroke-width="stroke"
      />
      <circle
        class="progress"
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke="color"
        :stroke-width="stroke"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
        :transform="`rotate(-90 ${size / 2} ${size / 2})`"
      />
    </svg>
    <div class="value">
      <strong :style="{ color, fontSize: `${size * 0.28}px` }">{{ Math.round(score) }}</strong>
      <span v-if="label" class="label">{{ label }}</span>
    </div>
  </div>
</template>

<style scoped>
.ring {
  position: relative;
  display: inline-grid;
  place-items: center;
}

svg {
  position: absolute;
  inset: 0;
}

.progress {
  transition: stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1), stroke 0.4s ease;
}

.value {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  z-index: 1;
}

.value strong {
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
}

.label {
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
</style>
