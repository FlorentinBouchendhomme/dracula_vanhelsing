import type { CardInstance, PlayerId, PlayerLayout, ZoneId, ZoneState } from "./types";
import { GAME_LIMITS, INITIAL_ASSETS, ZONE_IDS } from "./constants";

function makeZone(id: ZoneId): ZoneState {
  return { id, humans: GAME_LIMITS.tokensPerZone, vampires: 0 };
}

function makePlaceholderCard(playerId: PlayerId, zoneId: ZoneId): CardInstance {
  // Placeholder mapping => will be replaced by real setup rules
  const colors = ["GREEN", "YELLOW", "RED", "BLUE"] as const;
  const ids = [1, 2, 3, 4, 5, 6, 7, 8] as const;

  const color = colors[playerId === "P1" ? 0 : 1] ?? "GREEN";
  const id = ids[ZONE_IDS.indexOf(zoneId)] ?? 1;

  return { color, id };
}

function makePlayerLayout(playerId: PlayerId): PlayerLayout {
  return ZONE_IDS.reduce(
    (acc, zoneId) => {
      acc[zoneId] = makePlaceholderCard(playerId, zoneId);
      return acc;
    },
    {} as Record<ZoneId, CardInstance>
  );
}

export function createInitialGameState() {
  const zones = ZONE_IDS.reduce(
    (acc, id) => {
      acc[id] = makeZone(id);
      return acc;
    },
    {} as Record<ZoneId, ZoneState>
  );

  const players = {
    P1: { playerId: "P1" as const },
    P2: { playerId: "P2" as const }
  };

  return {
    version: 1,
    round: 1,
    draculaHp: GAME_LIMITS.draculaHpInitial,
    zones,
    assets: { ...INITIAL_ASSETS },
    players,

    layouts: {
      P1: makePlayerLayout("P1"),
      P2: makePlayerLayout("P2")
    },

    deck: {
      draw: [],
      discard: []
    },

    activePlayer: "P1",
    roundEnded: false,

    winner: null
  };
}
