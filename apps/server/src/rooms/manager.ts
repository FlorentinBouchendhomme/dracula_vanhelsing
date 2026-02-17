import type { RoomCode, RoomSummary, PlayerId, ServerToClient } from "@game/shared";
import { makeServerEnvelope } from "@game/shared";
import type { WebSocket } from "ws";
import type { GameState } from "@game/shared";
import { makeNewGameState } from "../game/state";
import type { PlayerKey, Room } from "./types";

function send(ws: WebSocket, msg: ServerToClient): void {
  ws.send(JSON.stringify(msg));
}

function makeRoomCode(): RoomCode {
  // Short code, enough for local use
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

function newPlayerKey(): PlayerKey {
  return crypto.randomUUID();
}

function toRoomSummary(room: Room): RoomSummary {
  return {
    code: room.code,
    slots: room.slots
  };
}

export class RoomManager {
  private rooms = new Map<RoomCode, Room>();

  createRoom(name: string): Room {
    let code = makeRoomCode();
    while (this.rooms.has(code)) code = makeRoomCode();

    const state = makeNewGameState();

    const room: Room = {
      code,
      name,
      state,
      slots: {
        P1: { playerId: "P1", isConnected: false, isReady: false },
        P2: { playerId: "P2", isConnected: false, isReady: false }
      },
      playerKeys: { P1: null, P2: null },
      socketsByPlayerId: {}
    };

    this.rooms.set(code, room);
    return room;
  }

  getRoom(code: RoomCode): Room | null {
    return this.rooms.get(code) ?? null;
  }

  joinRoom(
    room: Room,
    ws: WebSocket,
    playerKey: string | null
  ): { playerId: PlayerId; playerKey: string } | null {
    // Reconnect path
    if (playerKey) {
      const seat = (Object.keys(room.playerKeys) as PlayerId[]).find(
        (pid) => room.playerKeys[pid] === playerKey
      );

      if (seat) {
        // Replace existing socket if any (refresh/tab duplicate)
        const existing = room.socketsByPlayerId[seat];
        if (existing && existing !== ws) {
          try {
            existing.close();
          } catch {
            // ignore
          }
        }

        room.socketsByPlayerId[seat] = ws;
        room.slots[seat] = { ...room.slots[seat], isConnected: true };
        return { playerId: seat, playerKey };
      }

      return null; // INVALID_PLAYER_KEY handled by caller
    }

    // New join path => first available seat
    const available = (["P1", "P2"] as const).find((pid) => room.playerKeys[pid] === null);
    if (!available) return null; // ROOM_FULL handled by caller

    const newKey = newPlayerKey();
    room.playerKeys[available] = newKey;
    room.socketsByPlayerId[available] = ws;
    room.slots[available] = { ...room.slots[available], isConnected: true, isReady: false };

    return { playerId: available, playerKey: newKey };
  }

  leaveRoom(room: Room, playerId: PlayerId): void {
    const sock = room.socketsByPlayerId[playerId];
    if (sock) {
      delete room.socketsByPlayerId[playerId];
    }
    room.slots[playerId] = { ...room.slots[playerId], isConnected: false, isReady: false };
    // Keep playerKeys[playerId] for refresh reconnect
  }

  setReady(room: Room, playerId: PlayerId, isReady: boolean): void {
    room.slots[playerId] = { ...room.slots[playerId], isReady };
  }

  updateState(room: Room, nextState: GameState): void {
    room.state = nextState;
  }

  broadcastRoomState(room: Room): void {
    const msg = makeServerEnvelope(
      "ROOM_STATE",
      { room: toRoomSummary(room) },
      crypto.randomUUID()
    );

    for (const pid of ["P1", "P2"] as const) {
      const sock = room.socketsByPlayerId[pid];
      if (sock && sock.readyState === sock.OPEN) send(sock, msg as any);
    }
  }

  broadcastStateSync(room: Room): void {
    const msg = makeServerEnvelope(
      "STATE_SYNC",
      { code: room.code, state: room.state },
      crypto.randomUUID()
    );

    for (const pid of ["P1", "P2"] as const) {
      const sock = room.socketsByPlayerId[pid];
      if (sock && sock.readyState === sock.OPEN) send(sock, msg as any);
    }
  }
}
