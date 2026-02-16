import type { CardId, PlayerId, ZoneId } from "./types";

export type PlayCardAction = {
  kind: "PLAY_CARD";
  actor: PlayerId;
  cardId: CardId;
  target?: {
    zoneId?: ZoneId;
    playerId?: PlayerId;
  };
};

export type GameAction = PlayCardAction;
