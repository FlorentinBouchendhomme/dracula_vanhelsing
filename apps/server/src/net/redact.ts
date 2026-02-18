import type { CardInstance, GameState, PlayerId } from "@game/shared";

function cardKey(card: CardInstance): string {
  return `${card.color}:${card.id}`;
}

function isGloballyRevealed(state: GameState, card: CardInstance): boolean {
  const revealed = state.revealed ?? {};
  return Boolean(revealed[cardKey(card)]);
}

export function redactStateForPlayer(state: GameState, viewer: PlayerId): GameState {
  if (!state.drawnCard) return state;

  const canSee = state.activePlayer === viewer || isGloballyRevealed(state, state.drawnCard);

  if (canSee) return state;

  return {
    ...state,
    drawnCard: null
  };
}
