import type { PlayerId, ZoneId } from "@game/shared";

export type PlayCardAction = {
  kind: "PLAY_CARD";
  playerId: PlayerId;
  zoneId: ZoneId;
};

export type ServerAction =
  | PlayCardAction
  | { kind: "END_ROUND" }
  | { kind: "DAMAGE_DRACULA"; amount: number }
  | { kind: "TRANSFORM_IN_ZONE"; zoneId: ZoneId; amount: number } // amount => humans -> vampires
  | { kind: "SET_ACTIVE_PLAYER"; playerId: PlayerId };
