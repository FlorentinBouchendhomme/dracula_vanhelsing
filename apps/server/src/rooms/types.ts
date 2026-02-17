import type { GameState, PlayerId, RoomCode, RoomSummary, RoomSlot } from "@game/shared";
import type { WebSocket } from "ws";

export type PlayerKey = string;

export type Room = {
  code: RoomCode;
  name: string;
  state: GameState;

  slots: Record<PlayerId, RoomSlot>;
  playerKeys: Record<PlayerId, PlayerKey | null>;

  socketsByPlayerId: Partial<Record<PlayerId, WebSocket>>;
};
