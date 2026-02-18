<script setup lang="ts">
import type { GameState, PlayerId, ZoneId } from "@game/shared";
import { ZONE_IDS, getCardMeta } from "@game/shared";
import GameCard from "../cards/GameCard.vue";
import { useGameStore } from "../../state/game";
import { computed } from "vue";

const game = useGameStore();

const props = defineProps<{
  title: string;
  playerId: PlayerId;
  state: GameState;
  currentPlayerId: PlayerId | null; // viewer
  isPersonal?: boolean;
}>();

function isHidden(zoneId: ZoneId): boolean {
  const entry = props.state.layouts[props.playerId][zoneId];
  const isOwner = props.currentPlayerId === props.playerId;
  if (isOwner) return false;
  return entry.visibility === "HIDDEN";
}

function cardInfo(zoneId: ZoneId) {
  const entry = props.state.layouts[props.playerId][zoneId];
  const meta = getCardMeta(entry.card);
  return {
    color: entry.card.color,
    id: entry.card.id,
    description: meta.description
  };
}

const isClickable = computed(
  () => props.isPersonal && game.canAct() && props.state.turnPhase === "CHOOSE"
);
</script>

<template>
  <section style="padding: 12px; border: 1px solid #ddd; border-radius: 10px">
    <div style="display: flex; justify-content: space-between; gap: 12px">
      <div style="font-weight: 700">{{ title }}</div>
      <div style="opacity: 0.8">id => {{ playerId }}</div>
    </div>

    <hr style="border: none; border-top: 1px solid #eee; margin: 12px 0" />

    <div style="display: grid; gap: 10px">
      <div
        v-for="z in ZONE_IDS"
        :key="z"
        style="display: grid; gap: 8px; grid-template-columns: 90px 1fr; align-items: start"
      >
        <div style="font-weight: 700; padding-top: 6px">Zone {{ z }}</div>

        <div
          :style="{
            opacity: isClickable ? 1 : 0.7,
            cursor: isClickable ? 'pointer' : 'not-allowed',
            outline: game.selectedCardZoneId === z ? '2px solid #111' : 'none',
            borderRadius: '10px',
          }"
          @click="
            () => {
              if (!isPersonal) return;
              if (!game.canAct()) return;
              if (state.turnPhase !== 'CHOOSE') return;
              game.selectCardZone(z);
            }
          "
        >
          <GameCard
            :id="cardInfo(z).id"
            :color="cardInfo(z).color"
            :description="cardInfo(z).description"
            :is-hidden="isHidden(z)"
          />
        </div>
      </div>
    </div>
  </section>
</template>
