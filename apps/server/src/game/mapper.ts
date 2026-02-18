import type { UnknownAction } from "@game/shared";
import type { ServerAction } from "./actions";
import { isPlayerId, isZoneId } from "./validate";

export function mapUnknownAction(action: UnknownAction): ServerAction | null {
  switch (action.kind) {
    case "PLAY_CARD": {
      const payload = action.payload;

      if (!payload) return null;

      const { actor, zoneId } = payload;

      if (!isPlayerId(actor) || !isZoneId(zoneId)) return null;

      return {
        kind: "PLAY_CARD",
        playerId: actor,
        zoneId
      };
    }

    case "END_ROUND":
      return { kind: "END_ROUND" };

    case "DAMAGE_DRACULA": {
      const payload = action.payload as { amount?: unknown } | undefined;
      const amount = typeof payload?.amount === "number" ? payload.amount : null;
      if (amount === null) return null;
      return { kind: "DAMAGE_DRACULA", amount };
    }

    case "TRANSFORM_IN_ZONE": {
      const payload = action.payload as { zoneId?: unknown; amount?: unknown } | undefined;
      const zoneId = typeof payload?.zoneId === "string" ? payload.zoneId : null;
      const amount = typeof payload?.amount === "number" ? payload.amount : null;
      if (!isZoneId(zoneId) || amount === null) return null;
      return { kind: "TRANSFORM_IN_ZONE", zoneId, amount };
    }

    case "SET_ACTIVE_PLAYER": {
      const payload = action.payload as { playerId?: unknown } | undefined;
      const playerId = typeof payload?.playerId === "string" ? payload.playerId : null;
      if (!isPlayerId(playerId)) return null;
      return { kind: "SET_ACTIVE_PLAYER", playerId };
    }

    default:
      return null;
  }
}
