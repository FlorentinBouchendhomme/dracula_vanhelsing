<script setup lang="ts">
import type { ZoneId } from "@game/shared";

defineProps<{
  zoneId: ZoneId;
  title: string;
  humans: number;
  vampires: number;
}>();
</script>

<template>
  <div style="border: 1px solid #ddd; border-radius: 10px; padding: 10px">
    <div style="font-weight: 700">{{ title }}</div>
    <div style="opacity: 0.7; margin-bottom: 8px">id => {{ zoneId }}</div>

    <div style="display: grid; gap: 6px">
      <div>
        Humans => <b>{{ humans }}</b>
      </div>
      <div>
        Vampires => <b>{{ vampires }}</b>
      </div>
    </div>

    <div style="margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap; opacity: 0.7">
      <span style="border: 1px dashed #aaa; padding: 2px 6px; border-radius: 6px"
        >tokens ui later</span
      >
    </div>
  </div>
</template>
