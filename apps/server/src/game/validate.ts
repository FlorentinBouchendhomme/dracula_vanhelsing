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
