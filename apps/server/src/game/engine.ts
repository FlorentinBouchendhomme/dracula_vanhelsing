import type { GameState, ZoneId } from "@game/shared";
import { GAME_LIMITS } from "@game/shared";
import { computeWinner } from "./win";
import { ServerAction } from "./actions";

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function transformInZone(state: GameState, zoneId: ZoneId, amount: number): GameState {
  const zone = state.zones[zoneId];
  const canTransform = Math.min(zone.humans, Math.max(0, amount));

  const nextZone = {
    ...zone,
    humans: zone.humans - canTransform,
    vampires: zone.vampires + canTransform
  };

  return {
    ...state,
    zones: { ...state.zones, [zoneId]: nextZone }
  };
}

export function applyServerAction(state: GameState, action: ServerAction): GameState {
  if (state.winner) return state;

  let next: GameState;

  switch (action.kind) {
    case "END_ROUND": {
      const nextRound = clampInt(state.round + 1, 1, GAME_LIMITS.maxRounds) as GameState["round"];
      next = { ...state, round: nextRound, roundEnded: false };
      break;
    }

    case "DAMAGE_DRACULA": {
      const hp = clampInt(state.draculaHp - action.amount, 0, 999);
      next = { ...state, draculaHp: hp };
      break;
    }

    case "TRANSFORM_IN_ZONE": {
      next = transformInZone(state, action.zoneId, action.amount);
      break;
    }

    case "SET_ACTIVE_PLAYER": {
      next = { ...state, activePlayer: action.playerId };
      break;
    }

    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }

  const winner = computeWinner(next);
  if (winner) {
    next = { ...next, winner };
  }

  return { ...next, version: next.version + 1 };
}
