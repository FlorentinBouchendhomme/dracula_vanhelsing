import type { CardInstance, GameState, PlayerId, PlayerLayout, ZoneId, ZoneState } from "./types";
import { CARD_COLORS, GAME_LIMITS, ZONE_IDS } from "./constants";
import type { TrumpOrder } from "./types";

function shuffle<T>(arr: readonly T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function createInitialTrumpOrder(): TrumpOrder {
  const shuffled = shuffle(CARD_COLORS);
  const [c0, c1, c2, c3] = shuffled;
  if (!c0 || !c1 || !c2 || !c3) {
    // fallback deterministic order if something goes wrong
    return { nonTrumps: ["GREEN", "YELLOW", "RED"], trump: "BLUE" };
  }

  return {
    nonTrumps: [c0, c1, c2],
    trump: c3
  };
}

function makeZone(id: ZoneId): ZoneState {
  return { id, humans: GAME_LIMITS.tokensPerZone, vampires: 0 };
}

function makePlaceholderCard(playerId: PlayerId, zoneId: ZoneId): CardInstance {
  const colors = ["GREEN", "YELLOW", "RED", "BLUE"] as const;
  const ids = [1, 2, 3, 4, 5, 6, 7, 8] as const;

  const color = colors[playerId === "P1" ? 0 : 1] ?? "GREEN";
  const id = ids[ZONE_IDS.indexOf(zoneId)] ?? 1;

  return { color, id };
}

function makePlayerLayout(playerId: PlayerId): PlayerLayout {
  return ZONE_IDS.reduce((acc, zoneId) => {
    acc[zoneId] = {
      card: makePlaceholderCard(playerId, zoneId),
      visibility: "HIDDEN"
    };
    return acc;
  }, {} as PlayerLayout);
}

export function createInitialGameState(): GameState {
  const zones = ZONE_IDS.reduce(
    (acc, zoneId) => {
      acc[zoneId] = makeZone(zoneId);
      return acc;
    },
    {} as Record<ZoneId, ZoneState>
  );

  const players: GameState["players"] = {
    P1: { playerId: "P1" },
    P2: { playerId: "P2" }
  };

  return {
    version: 1,
    round: 1,
    draculaHp: GAME_LIMITS.draculaHpInitial,
    zones,
    assets: { order: createInitialTrumpOrder() },
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
