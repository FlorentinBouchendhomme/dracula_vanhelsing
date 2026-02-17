import type { PlayerId, RoomCode } from "@game/shared";

export type SocketSession = {
  roomCode: RoomCode | null;
  playerId: PlayerId | null;
  playerKey: string | null;
};
