import { WebSocketServer } from "ws";
import { isClientToServerMessage, makeServerEnvelope } from "@game/shared";
import type { ClientToServer, ServerToClient } from "@game/shared";
import { makeNewGameState } from "./game/state";
import { applyServerAction } from "./game/engine";
import { mapUnknownAction } from "./game/mapper";
import { validateStateVersion } from "./game/validate";
import { makeError } from "./net/errors";

const PORT = Number(process.env.PORT ?? 8787);
const ROOM_CODE = "LOCAL";

const wss = new WebSocketServer({ port: PORT });

let state = makeNewGameState();

function send(ws: import("ws").WebSocket, msg: ServerToClient): void {
  ws.send(JSON.stringify(msg));
}

function broadcast(msg: ServerToClient): void {
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) client.send(JSON.stringify(msg));
  }
}

function sync(ws?: import("ws").WebSocket): void {
  const msg = makeServerEnvelope("STATE_SYNC", { code: ROOM_CODE, state }, crypto.randomUUID());
  if (ws) send(ws, msg);
  else broadcast(msg);
}

wss.on("connection", (ws) => {
  sync(ws);

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

    if (msg.type === "PING") {
      send(ws, makeServerEnvelope("PONG", { t: msg.payload.t }, crypto.randomUUID()));
      return;
    }

    if (msg.type === "ACTION") {
      if (msg.payload.code !== ROOM_CODE) {
        send(ws, makeError("ROOM_NOT_FOUND", "Unknown room code", msg.id));
        return;
      }

      const versionCheck = validateStateVersion(state, msg.payload.stateVersion);
      if (versionCheck === "STALE") {
        send(ws, makeError("STALE_STATE", "Client stateVersion is stale", msg.id));
        sync(ws);
        return;
      }

      const mapped = mapUnknownAction(msg.payload.action);
      if (!mapped) {
        send(ws, makeError("INVALID_ACTION", "Unsupported or invalid action payload", msg.id));
        return;
      }

      state = applyServerAction(state, mapped);
      sync(); // broadcast to all clients
      return;
    }

    send(ws, makeError("NOT_IMPLEMENTED", "Message not implemented", msg.id));
  });
});

console.log(`WS server listening => ws://localhost:${PORT}`);
