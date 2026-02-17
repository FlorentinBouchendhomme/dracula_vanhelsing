import { WebSocketServer } from "ws";
import type { WebSocket } from "ws";

import { isClientToServerMessage, makeServerEnvelope } from "@game/shared";
import type { ClientToServer, GameState, ServerToClient } from "@game/shared";

import { applyServerAction } from "./game/engine";
import { mapUnknownAction } from "./game/mapper";
import { validateStateVersion } from "./game/validate";
import { makeError } from "./net/errors";
import type { SocketSession } from "./net/session";
import { RoomManager } from "./rooms/manager";

const PORT = Number(process.env.PORT ?? 8787);
const wss = new WebSocketServer({ port: PORT });

const rooms = new RoomManager();

function send(ws: WebSocket, msg: ServerToClient): void {
  ws.send(JSON.stringify(msg));
}

function syncOne(ws: WebSocket, code: string, state: GameState): void {
  send(ws, makeServerEnvelope("STATE_SYNC", { code, state }, crypto.randomUUID()));
}

wss.on("connection", (ws) => {
  const session: SocketSession = { roomCode: null, playerId: null, playerKey: null };

  ws.on("close", () => {
    if (!session.roomCode || !session.playerId) return;
    const room = rooms.getRoom(session.roomCode);
    if (!room) return;

    rooms.leaveRoom(room, session.playerId);
    rooms.broadcastRoomState(room);
  });

  ws.on("message", (data) => {
    const raw = data.toString();
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      send(ws, makeError("BAD_JSON", "Invalid JSON message"));
      return;
    }

    if (!isClientToServerMessage(parsed)) {
      send(ws, makeError("BAD_MESSAGE", "Invalid message envelope"));
      return;
    }

    const msg = parsed as ClientToServer;
    const refId = msg.id;

    if (msg.type === "PING") {
      send(ws, makeServerEnvelope("PONG", { t: msg.payload.t }, crypto.randomUUID()));
      return;
    }

    if (msg.type === "ROOM_CREATE") {
      const room = rooms.createRoom(msg.payload.name);

      send(ws, makeServerEnvelope("ROOM_CREATED", { code: room.code }, crypto.randomUUID()));
      // Client will call ROOM_JOIN next
      setInterval(() => {
        const removed = rooms.cleanupExpiredRooms();
        if (removed > 0) console.log(`rooms: cleanup removed => ${removed}`);
      }, 60_000);
      return;
    }

    if (msg.type === "ROOM_JOIN") {
      const room = rooms.getRoom(msg.payload.code);
      if (!room) {
        send(ws, makeError("ROOM_NOT_FOUND", "Unknown room code", refId));
        return;
      }

      const join = rooms.joinRoom(room, ws, msg.payload.playerKey);

      // playerKey provided but not matching
      if (msg.payload.playerKey && !join) {
        send(ws, makeError("INVALID_PLAYER_KEY", "Invalid playerKey for this room", refId));
        return;
      }

      // no playerKey and no seats
      if (!msg.payload.playerKey && !join) {
        send(ws, makeError("ROOM_FULL", "Room is full", refId));
        return;
      }

      if (!join) {
        send(ws, makeError("INTERNAL_ERROR", "Join failed", refId));
        return;
      }

      session.roomCode = room.code;
      session.playerId = join.playerId;
      session.playerKey = join.playerKey;

      send(
        ws,
        makeServerEnvelope(
          "ROOM_JOINED",
          { code: room.code, playerId: join.playerId, playerKey: join.playerKey },
          crypto.randomUUID()
        )
      );

      rooms.broadcastRoomState(room);
      rooms.broadcastStateSync(room);
      return;
    }

    if (msg.type === "ROOM_LEAVE") {
      if (!session.roomCode || !session.playerId) {
        send(ws, makeError("NOT_IN_ROOM", "Not in a room", refId));
        return;
      }
      const room = rooms.getRoom(session.roomCode);
      if (!room) {
        send(ws, makeError("ROOM_NOT_FOUND", "Unknown room code", refId));
        return;
      }

      rooms.leaveRoom(room, session.playerId);
      rooms.broadcastRoomState(room);

      session.roomCode = null;
      session.playerId = null;
      session.playerKey = null;

      return;
    }

    if (msg.type === "PLAYER_READY") {
      if (!session.roomCode || !session.playerId) {
        send(ws, makeError("NOT_IN_ROOM", "Not in a room", refId));
        return;
      }

      const room = rooms.getRoom(session.roomCode);
      if (!room) {
        send(ws, makeError("ROOM_NOT_FOUND", "Unknown room code", refId));
        return;
      }

      rooms.setReady(room, session.playerId, msg.payload.isReady);
      rooms.broadcastRoomState(room);
      return;
    }

    if (msg.type === "ACTION") {
      if (!session.roomCode || !session.playerId) {
        send(ws, makeError("NOT_IN_ROOM", "Not in a room", refId));
        return;
      }

      const room = rooms.getRoom(session.roomCode);
      if (!room) {
        send(ws, makeError("ROOM_NOT_FOUND", "Unknown room code", refId));
        return;
      }

      if (msg.payload.code !== room.code) {
        send(ws, makeError("ROOM_NOT_FOUND", "Room mismatch", refId));
        return;
      }

      const versionCheck = validateStateVersion(room.state, msg.payload.stateVersion);
      if (versionCheck === "STALE") {
        send(ws, makeError("STALE_STATE", "Client stateVersion is stale", refId));
        syncOne(ws, room.code, room.state);
        return;
      }

      const mapped = mapUnknownAction(msg.payload.action);
      if (!mapped) {
        send(ws, makeError("INVALID_ACTION", "Unsupported or invalid action payload", refId));
        return;
      }

      const nextState = applyServerAction(room.state, mapped);
      rooms.updateState(room, nextState);
      rooms.broadcastStateSync(room);

      return;
    }

    send(ws, makeError("NOT_IMPLEMENTED", "Message not implemented", refId));
  });
});
