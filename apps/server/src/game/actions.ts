import type { PlayerId, ZoneId } from "@game/shared";

export type ServerAction =
  | { kind: "DRAW_CARD"; playerId: PlayerId }
  | {
      kind: "RESOLVE_CHOICE";
      playerId: PlayerId;
      keepDrawn: boolean;
      zoneId?: ZoneId;
    }
  | { kind: "END_ROUND" }
  | { kind: "DAMAGE_DRACULA"; amount: number }
  | { kind: "TRANSFORM_IN_ZONE"; zoneId: ZoneId; amount: number } // amount => humans -> vampires
  | { kind: "DRAW_CARD"; playerId: PlayerId }
  | { kind: "RESOLVE_CHOICE"; playerId: PlayerId; keepDrawn: boolean; zoneId?: ZoneId }
  | { kind: "EFFECT_REVEAL_CARD"; playerId: PlayerId; targetPlayerId: PlayerId; zoneId: ZoneId }
  | { kind: "EFFECT_SWAP_OWN"; playerId: PlayerId; step: "PICK_A" | "PICK_B"; zoneId: ZoneId }
  | { kind: "EFFECT_SWAP_SAME_ZONE"; playerId: PlayerId; zoneId: ZoneId }
  | { kind: "SET_ACTIVE_PLAYER"; playerId: PlayerId };
