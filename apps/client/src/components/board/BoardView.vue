<script setup lang="ts">
import type { GameState, PlayerId, RoomSummary } from "@game/shared";
import BoardCommon from "./BoardCommon.vue";
import PlayerArea from "./PlayerArea.vue";

const props = defineProps<{
  room: RoomSummary;
  state: GameState;
  viewerPlayerId: PlayerId | null;
}>();

function opponentOf(viewer: PlayerId | null): PlayerId {
  return viewer === "P1" ? "P2" : "P1";
}

const opponentPlayerId = opponentOf(props.viewerPlayerId);
const personalPlayerId = (props.viewerPlayerId ?? "P1") as PlayerId;
</script>

<template>
  <div style="display: grid; gap: 16px">
    <!-- Opponent -->
    <PlayerArea
      :title="`Player ${opponentPlayerId} (opponent)`"
      :player-id="opponentPlayerId"
      :state="state"
      :current-player-id="viewerPlayerId"
    />

    <!-- Common board -->
    <BoardCommon :room="room" :state="state" />

    <!-- Personal -->
    <PlayerArea
      :title="`Player ${personalPlayerId} (you)`"
      :player-id="personalPlayerId"
      :state="state"
      :current-player-id="viewerPlayerId"
      is-personal
    />
  </div>
</template>
