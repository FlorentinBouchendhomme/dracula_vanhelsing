<script setup lang="ts">
import type { GameState, RoomSummary, ZoneId } from "@game/shared";
import { ZONE_IDS } from "@game/shared";
import ZoneCard from "./ZoneCard.vue";

defineProps<{
  room: RoomSummary;
  state: GameState;
}>();

function zoneTitle(zoneId: ZoneId): string {
  return `Zone ${zoneId}`;
}
</script>

<template>
  <section style="padding: 12px; border: 1px solid #ddd; border-radius: 10px">
    <div style="display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap">
      <div>
        <div style="font-weight: 700">Room => {{ room.code }}</div>
        <div style="opacity: 0.8">Version => {{ state.version }}</div>
      </div>

      <div style="display: flex; gap: 16px; flex-wrap: wrap">
        <div><b>Round</b> => {{ state.round }} / 5</div>
        <div><b>Dracula HP</b> => {{ state.draculaHp }}</div>
        <div>
          <b>Order</b> => {{ state.assets.order.nonTrumps[0] }} >
          {{ state.assets.order.nonTrumps[1] }} >
          {{ state.assets.order.nonTrumps[2] }}
          ; Trump =>
          {{ state.assets.order.trump }}
        </div>

        <div><b>Active</b> => {{ state.activePlayer }} ; roundEnded {{ state.roundEnded }}</div>
        <div v-if="state.winner"><b>Winner</b> => {{ state.winner }}</div>
      </div>
    </div>

    <hr style="border: none; border-top: 1px solid #eee; margin: 12px 0" />

    <div style="display: grid; gap: 12px; grid-template-columns: repeat(5, minmax(0, 1fr))">
      <ZoneCard
        v-for="z in ZONE_IDS"
        :key="z"
        :zone-id="z"
        :title="zoneTitle(z)"
        :humans="state.zones[z].humans"
        :vampires="state.zones[z].vampires"
      />
    </div>
  </section>
</template>
