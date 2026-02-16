import type { GameState, PlayerId } from "./types";

export type ClientToServer =
  | { type: "ROOM_CREATE"; name: string }
  | { type: "ROOM_JOIN"; code: string; playerKey: string | null }
  | { type: "ACTION"; action: UnknownAction; stateVersion: number }
  | { type: "PING"; t: number };

export type ServerToClient =
  | { type: "ROOM_CREATED"; code: string }
  | { type: "ROOM_JOINED"; code: string; playerId: PlayerId; playerKey: string }
  | { type: "STATE_SYNC"; state: GameState }
  | { type: "ERROR"; code: string; message: string }
  | { type: "PONG"; t: number };

export type UnknownAction = {
  kind: string;
  payload?: unknown;
};
