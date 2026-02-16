import { WebSocketServer } from "ws";
import { isClientToServerMessage, makeServerEnvelope } from "@game/shared";
import type { ClientToServer, ServerToClient } from "@game/shared";
import { makeNewGameState } from "./game/state";

const PORT = Number(process.env.PORT ?? 8787);

const wss = new WebSocketServer({ port: PORT });

const state = makeNewGameState();

function send(ws: import("ws").WebSocket, msg: ServerToClient): void {
  ws.send(JSON.stringify(msg));
}

wss.on("connection", (ws) => {
  send(ws, makeServerEnvelope("STATE_SYNC", { code: "LOCAL", state }, crypto.randomUUID()));

  ws.on("message", (data) => {
    const raw = data.toString();
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      send(
        ws,
        makeServerEnvelope(
          "ERROR",
          { code: "BAD_JSON", message: "Invalid JSON message" },
          crypto.randomUUID()
        )
      );
      return;
    }

    if (!isClientToServerMessage(parsed)) {
      send(
        ws,
        makeServerEnvelope(
          "ERROR",
          { code: "BAD_MESSAGE", message: "Invalid message envelope" },
          crypto.randomUUID()
        )
      );
      return;
    }

    const msg = parsed as ClientToServer;

    if (msg.type === "PING") {
      send(ws, makeServerEnvelope("PONG", { t: msg.payload.t }, crypto.randomUUID()));
      return;
    }

    // Rooms/actions will be implemented in next steps
    send(
      ws,
      makeServerEnvelope(
        "ERROR",
        {
          code: "NOT_IMPLEMENTED",
          message: "Server engine ready, network flow pending",
          refId: msg.id
        },
        crypto.randomUUID()
      )
    );
  });
});

console.log(`WS server listening => ws://localhost:${PORT}`);
