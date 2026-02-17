<script setup lang="ts">
import type { GameState, PlayerId, RoomSummary } from "@game/shared";
import BoardCommon from "./BoardCommon.vue";
import PlayerArea from "./PlayerArea.vue";

defineProps<{
  room: RoomSummary;
  state: GameState;
  viewerPlayerId: PlayerId | null;
}>();
</script>

<template>
  <div style="display: grid; gap: 16px">
    <BoardCommon :room="room" :state="state" />

    <div style="display: grid; gap: 12px; grid-template-columns: 1fr 1fr">
      <PlayerArea
        title="Player P1"
        :player-id="'P1'"
        :state="state"
        :current-player-id="viewerPlayerId"
      />
      <PlayerArea
        title="Player P2"
        :player-id="'P2'"
        :state="state"
        :current-player-id="viewerPlayerId"
      />
    </div>
  </div>
</template>
