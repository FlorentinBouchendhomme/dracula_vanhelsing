import type {
  CardInstance,
  GameState,
  PlayerId,
  PlayerLayout,
  ZoneId,
  ZoneState,
  TrumpOrder
} from "./types";
import { CARD_COLORS, CARD_IDS, GAME_LIMITS, ZONE_IDS } from "./constants";

function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j] as T;
    copy[j] = tmp as T;
  }
  return copy;
}

function createInitialTrumpOrder(): TrumpOrder {
  const shuffled = shuffle(CARD_COLORS);
  const [c0, c1, c2, c3] = shuffled;
  if (!c0 || !c1 || !c2 || !c3) return { nonTrumps: ["GREEN", "YELLOW", "RED"], trump: "BLUE" };
  return { nonTrumps: [c0, c1, c2], trump: c3 };
}

function makeZone(id: ZoneId): ZoneState {
  return { id, humans: GAME_LIMITS.tokensPerZone, vampires: 0 };
}

function makeFullDeck(): CardInstance[] {
  return CARD_COLORS.flatMap((color) => CARD_IDS.map((id) => ({ color, id })));
}

function makeEmptyLayout(): PlayerLayout {
  return ZONE_IDS.reduce((acc, zoneId) => {
    acc[zoneId] = { card: { color: "GREEN", id: 1 }, visibility: "HIDDEN" };
    return acc;
  }, {} as PlayerLayout);
}

function dealCard(draw: CardInstance[]): CardInstance {
  const card = draw.shift();
  if (!card) {
    // English comment => deck underflow should never happen with 32 cards
    throw new Error("Deck underflow while dealing");
  }
  return card;
}

function dealInterleavedByZone(draw: CardInstance[]): Record<PlayerId, PlayerLayout> {
  const layouts: Record<PlayerId, PlayerLayout> = {
    P1: makeEmptyLayout(),
    P2: makeEmptyLayout()
  };

  for (const zoneId of ZONE_IDS) {
    layouts.P1[zoneId] = { card: dealCard(draw), visibility: "HIDDEN" };
    layouts.P2[zoneId] = { card: dealCard(draw), visibility: "HIDDEN" };
  }

  return layouts;
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

  const draw = shuffle(makeFullDeck());
  const layouts = dealInterleavedByZone(draw);

  return {
    version: 1,
    round: 1,
    draculaHp: GAME_LIMITS.draculaHpInitial,

    roles: { P1: "DRACULA", P2: "VAN_HELSING" },

    zones,
    assets: { order: createInitialTrumpOrder() },
    players,
    layouts,
    deck: { draw, discard: [] },

    activePlayer: "P1",
    roundEnded: false,
    roundEndReason: null,
    skipNextTurn: false,

    turnPhase: "DRAW",
    drawnCard: null,

    log: [],
    effectPrompt: null,
    revealed: {},

    replayPending: false,

    winner: null
  };
}

export function startNewRound(prev: GameState): GameState {
  const draw = shuffle(makeFullDeck());
  const layouts = dealInterleavedByZone(draw);

  return {
    ...prev,
    version: prev.version + 1,
    layouts,
    deck: { draw, discard: [] },
    assets: { order: createInitialTrumpOrder() },
    roundEnded: false,
    roundEndReason: null,
    skipNextTurn: false,
    turnPhase: "DRAW",
    drawnCard: null,
    log: [],
    effectPrompt: null,
    revealed: {},
    activePlayer: "P1",
    replayPending: false,
  };
}
