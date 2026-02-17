<script setup lang="ts">
import type { GameState, PlayerId, ZoneId } from "@game/shared";
import { ZONE_IDS, getCardMeta } from "@game/shared";

defineProps<{
  title: string;
  playerId: PlayerId;
  state: GameState;
  currentPlayerId: PlayerId | null;
}>();

function displayCard(
  state: GameState,
  playerId: PlayerId,
  zoneId: ZoneId,
  current: PlayerId | null
): string {
  const entry = state.layouts[playerId][zoneId];

  const isOwner = current === playerId;

  if (!isOwner && entry.visibility === "HIDDEN") {
    return "Hidden card";
  }

  const meta = getCardMeta(entry.card);
  return `${entry.card.color} ${entry.card.id} => ${meta.description}`;
}
</script>

<template>
  <section style="padding: 12px; border: 1px solid #ddd; border-radius: 10px">
    <div style="display: flex; justify-content: space-between; gap: 12px">
      <div style="font-weight: 700">{{ title }}</div>
      <div style="opacity: 0.8">id => {{ playerId }}</div>
    </div>

    <hr style="border: none; border-top: 1px solid #eee; margin: 12px 0" />

    <div style="display: grid; gap: 8px">
      <div
        v-for="z in ZONE_IDS"
        :key="z"
        style="border: 1px solid #eee; border-radius: 8px; padding: 8px"
      >
        <div style="font-weight: 600">Zone {{ z }}</div>
        <div style="opacity: 0.8; margin-top: 4px">
          {{ displayCard(state, playerId, z, currentPlayerId) }}
        </div>
      </div>
    </div>
  </section>
</template>
