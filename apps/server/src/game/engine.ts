import type { GameState, PlayerId, ZoneId } from "@game/shared";
import { GAME_LIMITS } from "@game/shared";
import { computeWinner } from "./win";
import { ServerAction } from "./actions";
import { validatePlayCard } from "./validate";

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

    case "PLAY_CARD": {
      const validationError = validatePlayCard(state, action.playerId, action.zoneId);
      if (validationError) {
        return state; // No state change; error already handled earlier if needed
      }

      const entry = state.layouts[action.playerId][action.zoneId];
      const playedCard = entry.card;

      const nextDiscard = [...state.deck.discard, playedCard];
      const nextDraw = [...state.deck.draw];

      // Draw replacement card if available
      const replacement = nextDraw.shift();

      const nextLayouts = {
        ...state.layouts,
        [action.playerId]: {
          ...state.layouts[action.playerId],
          [action.zoneId]: replacement ? { card: replacement, visibility: "HIDDEN" } : entry // no replacement if deck empty
        }
      };

      const nextActivePlayer: PlayerId = action.playerId === "P1" ? "P2" : "P1";

      let nextState = {
        ...state,
        layouts: nextLayouts,
        deck: {
          draw: nextDraw,
          discard: nextDiscard
        },
        activePlayer: nextActivePlayer
      };

      // End of round if deck empty AFTER turn
      if (nextDraw.length === 0) {
        nextState = {
          ...nextState,
          roundEnded: true,
          roundEndReason: "DECK_EMPTY"
        };
      }

      next = nextState;
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
