<script setup lang="ts">
import type { PlayerId, ZoneId } from "@game/shared";
import { ZONE_IDS } from "@game/shared";
import { computed } from "vue";
import { useGameStore } from "../../state/game";

const game = useGameStore();

const prompt = computed(() => game.state?.effectPrompt ?? null);

const actor = computed(() => prompt.value?.actor ?? null);

const kind = computed(() => prompt.value?.kind ?? null);

const targetPlayerId = computed<PlayerId | null>(() => {
  if (!prompt.value || !game.playerId) return null;

  if (prompt.value.kind === "REVEAL_OWN") return game.playerId;
  // REVEAL_OPP
  return game.playerId === "P1" ? "P2" : "P1";
});

const hiddenZones = computed<ZoneId[]>(() => {
  if (!game.state || !targetPlayerId.value) return [];
  const layout = game.state.layouts[targetPlayerId.value];
  return ZONE_IDS.filter((z) => layout[z].visibility === "HIDDEN");
});

const title = computed(() => {
  const p = game.state?.effectPrompt;
  if (!p) return "";

  switch (p.kind) {
    case "REVEAL_OWN":
      return "Choose one of your hidden cards to reveal";

    case "REVEAL_OPP":
      return "Choose one opponent hidden card to reveal";

    case "SWAP_OWN":
      if (p.step === "PICK_A") return "Choose first card to swap (your board)";
      return `Choose second card to swap (first => ${p.firstZoneId})`;

    case "SWAP_SAME_ZONE":
      return "Choose zone to swap with opponent";

    case "SWAP_TRUMP":
      return "Choose a new trump color (swap with current trump)";

    default: {
      const _exhaustive: never = p;
      return _exhaustive;
    }
  }
});

function onPick(zoneId: ZoneId) {
  const p = game.state?.effectPrompt;
  if (!p) return;

  if (p.kind === "REVEAL_OWN" || p.kind === "REVEAL_OPP") {
    if (!targetPlayerId.value) return;
    game.revealCard(targetPlayerId.value, zoneId);
    return;
  }

  if (p.kind === "SWAP_OWN") {
    game.swapOwnPick(p.step, zoneId);
    return;
  }

  if (p.kind === "SWAP_SAME_ZONE") {
    game.swapSameZone(zoneId);
    return;
  }
}

const availableZones = computed<ZoneId[]>(() => {
  if (!game.state?.effectPrompt || !targetPlayerId.value) return [];

  const p = game.state.effectPrompt;

  if (p.kind === "REVEAL_OWN" || p.kind === "REVEAL_OPP") {
    const layout = game.state.layouts[targetPlayerId.value];
    return ZONE_IDS.filter((z) => layout[z].visibility === "HIDDEN");
  }

  if (p.kind === "SWAP_OWN") {
    if (p.step === "PICK_A") return [...ZONE_IDS];
    return ZONE_IDS.filter((z) => z !== p.firstZoneId);
  }

  if (p.kind === "SWAP_SAME_ZONE") {
    return [...ZONE_IDS];
  }

  return [];
});
</script>

<template>
  <div
    v-if="game.state && game.state.turnPhase === 'EFFECT' && prompt && actor === game.playerId"
    style="
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 1100;
    "
  >
    <div
      style="background: white; border-radius: 12px; padding: 14px; width: 520px; max-width: 100%"
    >
      <div style="font-weight: 800; margin-bottom: 6px">{{ title }}</div>
      <div v-if="game.state?.effectPrompt?.kind === 'SWAP_TRUMP'" style="display: grid; gap: 8px">
        <div style="opacity: 0.8">
          Current => Trump {{ game.state.assets.order.trump }} ; Order =>
          {{ game.state.assets.order.nonTrumps[0] }} > {{ game.state.assets.order.nonTrumps[1] }} >
          {{ game.state.assets.order.nonTrumps[2] }}
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap">
          <button
            v-for="c in game.state.assets.order.nonTrumps"
            :key="c"
            @click="game.swapTrump(c)"
            style="padding: 10px 10px"
          >
            Set trump => {{ c }}
          </button>
        </div>

        <div style="opacity: 0.7; font-size: 12px">
          You can only pick one of the 3 non-trump colors.
        </div>
      </div>

      <div style="opacity: 0.75; margin-bottom: 12px">Target => {{ targetPlayerId }}</div>

      <div v-if="hiddenZones.length === 0" style="opacity: 0.8">No hidden cards available.</div>

      <div style="display: grid; gap: 8px; grid-template-columns: repeat(5, minmax(0, 1fr))">
        <button v-for="z in hiddenZones" :key="z" @click="onPick(z)" style="padding: 10px 8px">
          Zone {{ z }}
        </button>
      </div>

      <div style="opacity: 0.7; font-size: 12px; margin-top: 12px">
        Only hidden cards can be revealed.
      </div>
    </div>
  </div>
</template>
