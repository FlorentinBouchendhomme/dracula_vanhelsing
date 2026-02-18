<script setup lang="ts">
import { computed } from "vue";
import { useGameStore } from "../../state/game";

const game = useGameStore();

const canConfirm = computed(() => game.canAct() && Boolean(game.selectedCardZoneId));
const reason = computed(() => {
  if (!game.state) return "No state";
  if (game.status !== "connected") return "Not connected";
  if (!game.playerId) return "Not joined";
  if (game.state.winner) return "Game finished";
  if (game.state.roundEnded) return "Round ended";
  if (game.state.activePlayer !== game.playerId) return "Not your turn";
  const slot = game.room?.slots?.[game.playerId];
  if (!slot?.isReady) return "Not ready";
  if (!game.selectedCardZoneId) return "No card selected";
  return null;
});
</script>

<template>
  <div
    style="
      position: sticky;
      bottom: 0;
      background: white;
      border-top: 1px solid #eee;
      padding: 12px;
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
    "
  >
    <div style="opacity: 0.8">
      <div v-if="game.selectedCardZoneId">Selected => zone {{ game.selectedCardZoneId }}</div>
      <div v-else>Selected => none</div>
      <div v-if="reason" style="font-size: 12px; opacity: 0.7">Disabled => {{ reason }}</div>
    </div>

    <div style="display: flex; gap: 8px">
      <button
        :disabled="!game.selectedCardZoneId"
        style="padding: 8px 12px"
        @click="game.clearSelection()"
      >
        Cancel
      </button>

      <button
        @click="game.resolveChoice(true, game.selectedCardZoneId ?? undefined)"
        :disabled="!canConfirm"
        style="padding: 8px 12px"
      >
        Keep drawn
      </button>
    </div>
  </div>
</template>
