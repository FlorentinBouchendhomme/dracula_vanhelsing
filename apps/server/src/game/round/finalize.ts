import type { GameState, PlayerId, ZoneId } from "@game/shared";
import { GAME_LIMITS, ZONE_IDS } from "@game/shared";
import { redealNewRound } from "./deal";

function pushLog(state: GameState, text: string): GameState {
  const next = [
    ...(Array.isArray(state.log) ? state.log : []),
    { id: crypto.randomUUID(), ts: Date.now(), text }
  ];
  return { ...state, log: next.length > 120 ? next.slice(-120) : next };
}

function transformOne(state: GameState, zoneId: ZoneId): GameState {
  const z = state.zones[zoneId];
  if (!z) return state;
  if (z.humans <= 0) return state;

  return {
    ...state,
    zones: {
      ...state.zones,
      [zoneId]: { ...z, humans: z.humans - 1, vampires: z.vampires + 1 }
    }
  };
}

function damageDracula(state: GameState, amount: number): GameState {
  return { ...state, draculaHp: Math.max(0, state.draculaHp - amount) };
}

function checkImmediateWinner(state: GameState): PlayerId | null {
  // Dracula priority condition => any zone has 4 vampires
  for (const z of ZONE_IDS) {
    if (state.zones[z].vampires >= GAME_LIMITS.tokensPerZone) return "P1";
  }

  // Van Helsing => Dracula HP reaches 0
  if (state.draculaHp <= 0) return "P2";

  return null;
}

export function finalizeRound(state: GameState): GameState {
  if (state.winner) return state;
  if (!state.roundEnded) return state;
  if (!state.roundResolution) return state;

  const resolution = state.roundResolution; // snapshot => never null in this scope

  let s = state;

  // Apply resolution zone-by-zone with Dracula priority after each zone
  for (const zoneId of ZONE_IDS) {
    const winner = resolution.byZone[zoneId];

    if (winner === "P2") {
      s = pushLog(s, `Finalize ${zoneId} => Van Helsing wins => Dracula -1 HP`);
      s = damageDracula(s, 1);
    } else if (winner === "P1") {
      s = pushLog(s, `Finalize ${zoneId} => Dracula wins => transform 1 human`);
      s = transformOne(s, zoneId);
    } else {
      s = pushLog(s, `Finalize ${zoneId} => draw => no effect`);
    }

    const w = checkImmediateWinner(s);

    // Dracula has priority => if P1 wins now, stop immediately even if future zones could kill him
    if (w === "P1") {
      s = pushLog(s, `Winner => Dracula (priority)`);
      return { ...s, winner: "P1" };
    }
    if (w === "P2") {
      s = pushLog(s, `Winner => Van Helsing`);
      return { ...s, winner: "P2" };
    }
  }

  // No immediate winner => check survive 5 rounds
  if (s.round === GAME_LIMITS.maxRounds) {
    s = pushLog(s, `Winner => Dracula (survived ${GAME_LIMITS.maxRounds} rounds)`);
    return { ...s, winner: "P1" };
  }

  // Start next round => redeal
  const nextRound = (s.round + 1) as GameState["round"];

  const dealt = redealNewRound(s);

  s = pushLog(s, `New round => ${nextRound}`);

  return {
    ...s,
    ...dealt,

    round: nextRound,

    roundEnded: false,
    roundEndReason: null,
    roundResolution: null,
    skipNextTurn: false,

    turnPhase: "DRAW",
    drawnCard: null,
    effectPrompt: null,
    replayPending: false,

    activePlayer: "P1"
  };
}
