import type { CardInstance, GameState, PlayerId } from "@game/shared";

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

    default:
      return pushLog(state, `${actor} played ${played.id} => effect not implemented`);
  }
}

export function shouldBeVisibleFromGlobalReveal(state: GameState, card: CardInstance): boolean {
  return Boolean(state.revealed[cardKey(card)]);
}
