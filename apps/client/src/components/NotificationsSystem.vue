<script setup lang="ts">
import { useGameStore } from "../state/game";

const game = useGameStore();
</script>

<template>
  <div
    style="
      position: fixed;
      top: 16px;
      right: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 1000;
    "
  >
    <div
      v-for="n in game.notifications"
      :key="n.id"
      :style="{
        padding: '10px 14px',
        borderRadius: '8px',
        color: 'white',
        minWidth: '220px',
        background: n.level === 'error' ? '#c0392b' : '#2c3e50'
      }"
    >
      {{ n.message }}
    </div>
  </div>
</template>
