import type { GameState, PlayerId } from "@game/shared";
import { GAME_LIMITS, ZONE_IDS } from "@game/shared";

export function computeWinner(state: GameState): PlayerId | null {
  if (state.draculaHp <= 0) return "P2"; // P2 is Van Helsing (adjust later if needed)

  const hasFullVampireZone = ZONE_IDS.some((z) => state.zones[z].vampires >= 4);
  if (hasFullVampireZone) return "P1"; // P1 is Dracula

  if (state.round >= GAME_LIMITS.maxRounds) return "P1";

  return null;
}
