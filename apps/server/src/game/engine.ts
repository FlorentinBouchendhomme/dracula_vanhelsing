import type { GameState, PlayerId, ZoneId } from "@game/shared";
import { GAME_LIMITS } from "@game/shared";
import { computeWinner } from "./win";
import { ServerAction } from "./actions";
import { validateDrawCard, validateEffectRevealCard, validateResolveChoice } from "./validate";
import { applyCardEffect, shouldBeVisibleFromGlobalReveal } from "./cards/effects";

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

function endTurnOrReplay(state: GameState, actor: PlayerId): GameState {
  // If deck is empty => round ends, replay cannot happen
  if (state.deck.draw.length === 0) {
    return {
      ...state,
      roundEnded: true,
      roundEndReason: "DECK_EMPTY",
      replayPending: false,
      turnPhase: "DRAW"
    };
  }

  // Replay => same player plays again
  if (state.replayPending) {
    return {
      ...state,
      replayPending: false,
      activePlayer: actor,
      turnPhase: "DRAW"
    };
  }

  // Normal turn switch
  const nextActive: PlayerId = actor === "P1" ? "P2" : "P1";
  return {
    ...state,
    activePlayer: nextActive,
    turnPhase: "DRAW"
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

    case "DRAW_CARD": {
      const err = validateDrawCard(state, action.playerId);
      if (err) return state;

      const nextDraw = [...state.deck.draw];
      const card = nextDraw.shift();
      if (!card) return state;

      next = {
        ...state,
        deck: { ...state.deck, draw: nextDraw },
        drawnCard: card,
        turnPhase: "CHOOSE",
        log: Array.isArray((state as any).log) ? (state as any).log : [],
        revealed: (state as any).revealed ?? {},
        effectPrompt: (state as any).effectPrompt ?? null
      };

      break;
    }

    case "RESOLVE_CHOICE": {
      const err = validateResolveChoice(state, action.playerId, action.keepDrawn, action.zoneId);
      if (err) return state;

      const drawn = state.drawnCard;
      if (!drawn) return state;

      let nextLayouts = state.layouts;
      const nextDiscard = [...state.deck.discard];

      let playedCard = drawn;

      if (action.keepDrawn && action.zoneId) {
        const oldCard = state.layouts[action.playerId][action.zoneId].card;
        playedCard = oldCard;
        nextDiscard.push(oldCard);

        const visible = shouldBeVisibleFromGlobalReveal(state, drawn);

        nextLayouts = {
          ...state.layouts,
          [action.playerId]: {
            ...state.layouts[action.playerId],
            [action.zoneId]: {
              card: drawn,
              visibility: visible ? "VISIBLE" : "HIDDEN"
            }
          }
        };
      } else {
        // discard drawn (played)
        nextDiscard.push(drawn);
      }

      let intermediate: GameState = {
        ...state,
        layouts: nextLayouts,
        deck: { ...state.deck, discard: nextDiscard },
        drawnCard: null,
        // default => will be overwritten by effect if prompt
        turnPhase: "DRAW",
        effectPrompt: null
      };

      // Apply effect (may set prompt + EFFECT phase)
      intermediate = applyCardEffect(intermediate, action.playerId, playedCard);

      // If effect requires prompt => keep actor as active player and stop here
      if (intermediate.turnPhase === "EFFECT" && intermediate.effectPrompt) {
        next = intermediate;
        break;
      }

      // Otherwise finish the turn normally
      next = endTurnOrReplay(intermediate, action.playerId)
      break;
    }

    case "EFFECT_REVEAL_CARD": {
      const err = validateEffectRevealCard(
        state,
        action.playerId,
        action.targetPlayerId,
        action.zoneId
      );
      if (err) return state;

      const entry = state.layouts[action.targetPlayerId][action.zoneId];

      const nextLayouts = {
        ...state.layouts,
        [action.targetPlayerId]: {
          ...state.layouts[action.targetPlayerId],
          [action.zoneId]: { ...entry, visibility: "VISIBLE" }
        }
      };

      const nextLog = [
        ...state.log,
        {
          id: crypto.randomUUID(),
          ts: Date.now(),
          text: `${action.playerId} revealed ${action.targetPlayerId}:${action.zoneId}`
        }
      ];

      const cleared: GameState = {
        ...state,
        layouts: nextLayouts,
        effectPrompt: null,
        turnPhase: "DRAW",
        log: nextLog
      };

      next = endTurnOrReplay(cleared, action.playerId)
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
