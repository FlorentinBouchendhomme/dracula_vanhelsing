<script setup lang="ts">
import type { GameState, RoomSummary, ZoneId } from "@game/shared";
import { getCardMeta, ZONE_IDS } from "@game/shared";
import ZoneCard from "./ZoneCard.vue";
import { useGameStore } from "../../state/game";
import { computed } from "vue";
import GameCard from "../cards/GameCard.vue";

const props = defineProps<{
  room: RoomSummary;
  state: GameState;
}>();

function zoneTitle(zoneId: ZoneId): string {
  return `Zone ${zoneId}`;
}

const game = useGameStore();

const canDraw = computed(() => {
  if (!game.canAct()) return false;
  return props.state.turnPhase === "DRAW";
});

const drawnMeta = computed(() => {
  if (!props.state.drawnCard) return null;
  return getCardMeta(props.state.drawnCard);
});

function cardKey(card: { color: string; id: number }): string {
  return `${card.color}:${card.id}`;
}

const isTopRevealed = computed(() => {
  const top = props.state.deck.draw[0];
  if (!top) return false;
  const revealed = props.state.revealed ?? {};
  return Boolean(revealed[cardKey(top)]);
});
const topCard = computed(() => props.state.deck.draw[0] ?? null);

const canDiscardDrawn = computed(() => {
  if (!game.canAct()) return false;
  if (props.state.turnPhase !== "CHOOSE") return false;
  const c = props.state.drawnCard;
  if (!c) return false;
  if (c.id === 8 && props.state.deck.discard.length < 6) return false;
  return true;
});
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

    <div style="display: grid; gap: 12px; margin-top: 12px">
      <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap">
        <button @click="game.drawCard()" :disabled="!canDraw" style="padding: 8px 12px">
          Pioche
        </button>

        <div style="opacity: 0.8">
          Phase => <b>{{ state.turnPhase }}</b> ; draw => {{ state.deck.draw.length }} ; discard =>
          {{ state.deck.discard.length }}
        </div>
        <div v-if="topCard && isTopRevealed" style="opacity: 0.85">
          Top revealed => {{ topCard.color }} {{ topCard.id }}
        </div>
      </div>

      <div v-if="state.drawnCard && drawnMeta" style="max-width: 420px">
        <div style="font-weight: 700; margin-bottom: 6px">Carte piochée</div>

        <div
          style="cursor: pointer"
          @click="
            () => {
              if (game.canAct() && state.turnPhase === 'CHOOSE') game.resolveChoice(false);
            }
          "
        >
          <GameCard
            :color="state.drawnCard.color"
            :id="state.drawnCard.id"
            :description="drawnMeta.description"
            :is-hidden="false"
          />
        </div>

        <div style="opacity: 0.7; font-size: 12px; margin-top: 6px">
          Click the drawn card => discard it and play its effect (later).
        </div>
      </div>

      <div v-if="state.log && state.log.length" style="margin-top: 12px">
        <div style="font-weight: 700; margin-bottom: 6px">Log</div>
        <div
          style="
            border: 1px solid #eee;
            border-radius: 10px;
            padding: 10px;
            max-height: 160px;
            overflow: auto;
          "
        >
          <div
            v-for="e in state.log.slice(-12)"
            :key="e.id"
            style="font-size: 12px; opacity: 0.85; margin-bottom: 4px"
          >
            {{ e.text }}
          </div>
        </div>
      </div>
    </div>

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
