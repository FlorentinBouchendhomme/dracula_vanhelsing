import type { GameState, PlayerId, ZoneId } from "@game/shared";
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
