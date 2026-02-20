import type {
  CardInstance,
  CardVisibility,
  GameState,
  PlayerId,
  PlayerLayout,
  ZoneId
} from "@game/shared";
import { ZONE_IDS } from "@game/shared";

function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j]!;
    a[j] = tmp!;
  }
  return a;
}

function cardKey(card: CardInstance): string {
  return `${card.color}:${card.id}`;
}

function defaultVisibility(state: GameState, card: CardInstance): CardVisibility {
  return state.revealed?.[cardKey(card)] ? "VISIBLE" : "HIDDEN";
}

export function redealNewRound(state: GameState): Pick<GameState, "deck" | "layouts"> {
  const pool: CardInstance[] = [];

  pool.push(...state.deck.draw);
  pool.push(...state.deck.discard);

  // Put back all layout cards
  for (const pid of ["P1", "P2"] as const) {
    for (const z of ZONE_IDS) {
      pool.push(state.layouts[pid][z].card);
    }
  }

  // Put back drawnCard if any (should be null when round ends, but safe)
  if (state.drawnCard) pool.push(state.drawnCard);

  const shuffled = shuffle(pool);

  const nextLayouts = {
    P1: {} as PlayerLayout,
    P2: {} as PlayerLayout
  } satisfies Record<PlayerId, PlayerLayout>;

  // Deal order => Z1 P1 ; Z1 P2 ; Z2 P1 ; Z2 P2 ; ...
  for (const zoneId of ZONE_IDS) {
    const cP1 = shuffled.shift();
    const cP2 = shuffled.shift();
    if (!cP1 || !cP2) {
      throw new Error(`Redeal failed => not enough cards for zone ${zoneId}`);
    }

    nextLayouts.P1[zoneId] = { card: cP1, visibility: defaultVisibility(state, cP1) };
    nextLayouts.P2[zoneId] = { card: cP2, visibility: defaultVisibility(state, cP2) };
  }

  return {
    layouts: nextLayouts,
    deck: {
      draw: shuffled,
      discard: []
    }
  };
}
