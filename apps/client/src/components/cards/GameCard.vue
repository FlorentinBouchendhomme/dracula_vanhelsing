<script setup lang="ts">
import type { CardColor, CardId } from "@game/shared";

defineProps<{
  color: CardColor;
  id: CardId;
  description: string;
  isHidden: boolean;
}>();

function headerText(color: CardColor, id: CardId): string {
  return `${color} ${id}`;
}
</script>

<template>
  <div
    :style="{
      border: '1px solid #ddd',
      borderRadius: '10px',
      padding: '10px',
      minHeight: '110px',
      background: isHidden ? '#f6f6f6' : 'white'
    }"
  >
    <div style="display: flex; justify-content: space-between; gap: 8px">
      <div style="font-weight: 800">
        {{ isHidden ? 'Hidden' : headerText(color, id) }}
      </div>
      <div
        :style="{
          padding: '2px 8px',
          borderRadius: '999px',
          border: '1px solid #ddd',
          fontSize: '12px',
          opacity: 0.9
        }"
      >
        {{ color }}
      </div>
    </div>

    <div style="margin-top: 8px; opacity: 0.85; font-size: 13px; line-height: 1.25">
      {{ isHidden ? 'Card is hidden.' : description }}
    </div>
  </div>
</template>
