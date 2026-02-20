import type { GameState, PlayerId, RoundResolution, ZoneId } from "@game/shared";
import { ZONE_IDS } from "@game/shared";
import { compareZoneCards } from "./compare";

export function computeRoundResolution(state: GameState): RoundResolution {
  const order = state.assets.order;

  const byZone = ZONE_IDS.reduce((acc, zoneId) => {
    const c1 = state.layouts.P1[zoneId].card;
    const c2 = state.layouts.P2[zoneId].card;

    const r = compareZoneCards(order, c1, c2, "P1", "P2");
    acc[zoneId] = r.winner;

    return acc;
  }, {} as Record<ZoneId, PlayerId | null>);

  return { byZone };
}
