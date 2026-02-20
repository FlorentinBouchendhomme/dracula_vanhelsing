import type { CardColor, CardInstance, GameState, PlayerId, ZoneId } from "@game/shared";
import { ZONE_IDS } from "@game/shared";

export function isZoneId(value: unknown): value is ZoneId {
  return typeof value === "string" && (ZONE_IDS as readonly string[]).includes(value);
}

export function isPlayerId(value: unknown): value is PlayerId {
  return value === "P1" || value === "P2";
}

export function validateStateVersion(state: GameState, clientVersion: number): "OK" | "STALE" {
  return clientVersion === state.version ? "OK" : "STALE";
}

export function validatePlayCard(
  state: GameState,
  playerId: PlayerId,
  zoneId: ZoneId
): string | null {
  if (state.winner) return "GAME_OVER";
  if (state.roundEnded) return "ROUND_ENDED";
  if (state.activePlayer !== playerId) return "NOT_YOUR_TURN";

  const layout = state.layouts[playerId];
  if (!layout) return "INVALID_PLAYER";

  const entry = layout[zoneId];
  if (!entry) return "INVALID_ZONE";

  return null;
}

export function validateDrawCard(state: GameState, playerId: PlayerId): string | null {
  if (state.winner) return "GAME_OVER";
  if (state.roundEnded) return "ROUND_ENDED";
  if (state.activePlayer !== playerId) return "NOT_YOUR_TURN";
  if (state.turnPhase !== "DRAW") return "INVALID_PHASE";
  if (state.deck.draw.length === 0) return "DECK_EMPTY";

  return null;
}

export function validateResolveChoice(
  state: GameState,
  playerId: PlayerId,
  keepDrawn: boolean,
  zoneId?: ZoneId
): string | null {
  if (state.activePlayer !== playerId) return "NOT_YOUR_TURN";
  if (state.turnPhase !== "CHOOSE") return "INVALID_PHASE";
  if (!state.drawnCard) return "NO_DRAWN_CARD";

  if (keepDrawn && !zoneId) return "ZONE_REQUIRED";

  return null;
}

export function canResolveEffectPrompt(state: GameState, actor: PlayerId): string | null {
  if (state.winner) return "GAME_OVER";
  if (state.roundEnded) return "ROUND_ENDED";
  if (state.turnPhase !== "EFFECT") return "INVALID_PHASE";
  if (!state.effectPrompt) return "NO_PROMPT";
  if (state.effectPrompt.actor !== actor) return "NOT_YOUR_PROMPT";
  return null;
}

export function validateEffectRevealCard(
  state: GameState,
  actor: PlayerId,
  targetPlayerId: PlayerId,
  zoneId: ZoneId
): string | null {
  const base = canResolveEffectPrompt(state, actor);
  if (base) return base;

  const prompt = state.effectPrompt;
  if (!prompt) return "NO_PROMPT";

  if (prompt.kind === "REVEAL_OWN" && targetPlayerId !== actor) return "INVALID_TARGET";
  if (prompt.kind === "REVEAL_OPP" && targetPlayerId === actor) return "INVALID_TARGET";

  const entry = state.layouts[targetPlayerId]?.[zoneId];
  if (!entry) return "INVALID_ZONE";

  if (entry.visibility !== "HIDDEN") return "ALREADY_VISIBLE";

  return null;
}

export function validateSwapOwnPick(
  state: GameState,
  actor: PlayerId,
  step: "PICK_A" | "PICK_B",
  zoneId: ZoneId
): string | null {
  const base = canResolveEffectPrompt(state, actor);
  if (base) return base;

  const prompt = state.effectPrompt;
  if (!prompt || prompt.kind !== "SWAP_OWN") return "NO_PROMPT";

  if (prompt.step !== step) return "INVALID_STEP";

  const entry = state.layouts[actor]?.[zoneId];
  if (!entry) return "INVALID_ZONE";

  if (step === "PICK_B") {
    if (!prompt.firstZoneId) return "INTERNAL_ERROR";
    if (prompt.firstZoneId === zoneId) return "SAME_ZONE";
  }

  return null;
}

export function validateSwapSameZone(
  state: GameState,
  actor: PlayerId,
  zoneId: ZoneId
): string | null {
  const base = canResolveEffectPrompt(state, actor);
  if (base) return base;

  const prompt = state.effectPrompt;
  if (!prompt || prompt.kind !== "SWAP_SAME_ZONE") return "NO_PROMPT";

  const opp: PlayerId = actor === "P1" ? "P2" : "P1";

  if (!state.layouts[actor]?.[zoneId]) return "INVALID_ZONE";
  if (!state.layouts[opp]?.[zoneId]) return "INVALID_ZONE";

  return null;
}

export function validateSwapTrump(
  state: GameState,
  actor: PlayerId,
  newTrump: CardColor
): string | null {
  const base = canResolveEffectPrompt(state, actor);
  if (base) return base;

  const prompt = state.effectPrompt;
  if (!prompt || prompt.kind !== "SWAP_TRUMP") return "NO_PROMPT";

  const order = state.assets.order;
  const idx = order.nonTrumps.indexOf(newTrump);
  if (idx < 0) return "INVALID_TRUMP_CHOICE"; // must be one of the 3 nonTrumps

  return null;
}

export function getPlayedCard(
  state: GameState,
  actor: PlayerId,
  keepDrawn: boolean,
  zoneId?: ZoneId
): CardInstance | null {
  if (keepDrawn) {
    if (!zoneId) return null;
    return state.layouts[actor]?.[zoneId]?.card ?? null;
  }
  return state.drawnCard ?? null;
}

export function validateCard8Constraint(state: GameState, played: CardInstance): string | null {
  if (played.id !== 8) return null;

  // condition => at least 6 cards in discard BEFORE playing 8
  if (state.deck.discard.length < 6) return "CARD_CONDITION_NOT_MET";

  return null;
}
