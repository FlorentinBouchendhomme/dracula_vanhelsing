import type { GameState, PlayerId, RoomCode, RoomSlot } from "@game/shared";
import type { WebSocket } from "ws";

export type PlayerKey = string;

export type RoomSnapshot = {
  stateJson: string; // Serialized GameState
  version: number;
  createdAt: number;
};

export type Room = {
  code: RoomCode;
  name: string;
  state: GameState;

  slots: Record<PlayerId, RoomSlot>;
  playerKeys: Record<PlayerId, PlayerKey | null>;

  socketsByPlayerId: Partial<Record<PlayerId, WebSocket>>;

  // Persistence helpers
  lastActivityAt: number;
  snapshot: RoomSnapshot;
};
