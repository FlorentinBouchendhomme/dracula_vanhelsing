import type { UnknownAction } from "@game/shared";
import type { ServerAction } from "./actions";
import { isPlayerId, isZoneId } from "./validate";

export function mapUnknownAction(action: UnknownAction): ServerAction | null {
  switch (action.kind) {
    case "DRAW_CARD": {
      const payload = action.payload;
      if (!payload) return null;

      if (!isPlayerId(payload.actor)) return null;

      return {
        kind: "DRAW_CARD",
        playerId: payload.actor
      };
    }

    case "RESOLVE_CHOICE": {
      const payload = action.payload;
      if (!payload) return null;

      const actor = payload.actor;
      const keepDrawn = payload.keepDrawn;

      if (!isPlayerId(actor)) return null;
      if (typeof keepDrawn !== "boolean") return null;

      if (keepDrawn) {
        const zoneId = payload.zoneId;
        if (!isZoneId(zoneId)) return null;

        return {
          kind: "RESOLVE_CHOICE",
          playerId: actor,
          keepDrawn: true,
          zoneId
        };
      }

      return {
        kind: "RESOLVE_CHOICE",
        playerId: actor,
        keepDrawn: false
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

    case "EFFECT_REVEAL_CARD": {
      const payload = action.payload;
      if (!payload) return null;

      const { actor, targetPlayerId, zoneId } = payload;

      if (!isPlayerId(actor)) return null;
      if (!isPlayerId(targetPlayerId)) return null;
      if (!isZoneId(zoneId)) return null;

      return {
        kind: "EFFECT_REVEAL_CARD",
        playerId: actor,
        targetPlayerId,
        zoneId
      };
    }

    case "EFFECT_SWAP_OWN": {
      const payload = action.payload;
      if (!payload) return null;

      const actor = payload.actor;
      const step = (payload as any).step;

      if (!isPlayerId(actor)) return null;
      if (step !== "PICK_A" && step !== "PICK_B") return null;

      const zoneId = step === "PICK_A" ? (payload as any).zoneA : (payload as any).zoneB;
      if (!isZoneId(zoneId)) return null;

      return { kind: "EFFECT_SWAP_OWN", playerId: actor, step, zoneId };
    }

    case "EFFECT_SWAP_SAME_ZONE": {
      const payload = action.payload;
      if (!payload) return null;

      const actor = payload.actor;
      const zoneId = payload.zoneId;

      if (!isPlayerId(actor)) return null;
      if (!isZoneId(zoneId)) return null;

      return { kind: "EFFECT_SWAP_SAME_ZONE", playerId: actor, zoneId };
    }

    default:
      return null;
  }
}
