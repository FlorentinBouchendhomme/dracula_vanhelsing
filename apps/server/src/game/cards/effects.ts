import type { CardInstance, GameState, PlayerId } from "@game/shared";
import { compareZoneCards } from "../round/resolve";

function cardKey(card: CardInstance): string {
  return `${card.color}:${card.id}`;
}

function pushLog(state: GameState, text: string): GameState {
  const next = [...state.log, { id: crypto.randomUUID(), ts: Date.now(), text }];
  // Optional trim to last 80
  const trimmed = next.length > 80 ? next.slice(next.length - 80) : next;
  return { ...state, log: trimmed };
}

export function applyCardEffect(
  state: GameState,
  actor: PlayerId,
  played: CardInstance
): GameState {
  switch (played.id) {
    case 1: {
      // prompt => reveal one of your hidden cards
      const s1 = pushLog(state, `${actor} played 1 => reveal one own hidden card`);
      return { ...s1, effectPrompt: { kind: "REVEAL_OWN", actor }, turnPhase: "EFFECT" };
    }

    case 2: {
      // reveal top of deck => persist globally
      const top = state.deck.draw[0] ?? null;
      if (!top) return pushLog(state, `${actor} played 2 => deck is empty`);
      const key = cardKey(top);
      const s1 = pushLog(state, `${actor} played 2 => reveal top ${key}`);
      return { ...s1, revealed: { ...s1.revealed, [key]: true } };
    }

    case 3: {
      const s1 = pushLog(state, `${actor} played 3 => reveal one opponent hidden card`);
      return { ...s1, effectPrompt: { kind: "REVEAL_OPP", actor }, turnPhase: "EFFECT" };
    }

    case 4: {
      const s1 = pushLog(state, `${actor} played 4 => swap two own cards`);
      return {
        ...s1,
        effectPrompt: { kind: "SWAP_OWN", actor, step: "PICK_A" },
        turnPhase: "EFFECT"
      };
    }

    case 5: {
      const s1 = pushLog(state, `${actor} played 5 => replay`);
      return { ...s1, replayPending: true };
    }

    case 6: {
      const s1 = pushLog(state, `${actor} played 6 => swap with opponent same zone`);
      return {
        ...s1,
        effectPrompt: { kind: "SWAP_SAME_ZONE", actor },
        turnPhase: "EFFECT"
      };
    }

    case 7: {
      const s1 = pushLog(state, `${actor} played 7 => swap trump color`);
      return {
        ...s1,
        effectPrompt: { kind: "SWAP_TRUMP", actor },
        turnPhase: "EFFECT"
      };
    }

    case 8: {
      // Constraint already validated before apply
      const order = state.assets.order;

      const byZone = {} as Record<import("@game/shared").ZoneId, PlayerId | null>;

      for (const z of ["Z1", "Z2", "Z3", "Z4", "Z5"] as const) {
        const c1 = state.layouts.P1[z].card;
        const c2 = state.layouts.P2[z].card;

        const r = compareZoneCards(order, c1, c2, "P1", "P2");
        byZone[z] = r.winner;

        // Log détaillé
        state = pushLog(
          state,
          `RoundEnd Z${z} => P1 ${c1.color}:${c1.id} vs P2 ${c2.color}:${c2.id} => ${r.winner ?? "DRAW"} (${r.reason})`
        );
      }

      const s1 = pushLog(state, `${actor} played 8 => end round now`);
      return {
        ...s1,
        roundEnded: true,
        roundEndReason: "CARD_8",
        roundResolution: { byZone },
        // Stop everything
        effectPrompt: null,
        drawnCard: null,
        turnPhase: "DRAW",
        replayPending: false
      };
    }

    default:
      return pushLog(state, `${actor} played ${played.id} => effect not implemented`);
  }
}

export function shouldBeVisibleFromGlobalReveal(state: GameState, card: CardInstance): boolean {
  return Boolean(state.revealed[cardKey(card)]);
}
