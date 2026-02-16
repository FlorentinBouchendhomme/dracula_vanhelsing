import { WebSocketServer } from "ws";
import type { ClientToServer, ServerToClient } from "@game/shared";

const PORT = Number(process.env.PORT ?? 8787);

const wss = new WebSocketServer({ port: PORT });

function safeParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function send(ws: import("ws").WebSocket, msg: ServerToClient): void {
  ws.send(JSON.stringify(msg));
}

wss.on("connection", (ws) => {
  send(ws, { type: "STATE_SYNC", state: demoState() });

  ws.on("message", (data) => {
    const raw = data.toString();
    const msg = safeParse<ClientToServer>(raw);

    if (!msg) {
      send(ws, {
        type: "ERROR",
        code: "BAD_JSON",
        message: "Invalid JSON message"
      });
      return;
    }

    if (msg.type === "PING") {
      send(ws, { type: "PONG", t: msg.t });
      return;
    }

    // Placeholder => real room/join/action will come in later steps
    send(ws, {
      type: "ERROR",
      code: "NOT_IMPLEMENTED",
      message: "Server skeleton only"
    });
  });
});

console.log(`WS server listening => ws://localhost:${PORT}`);

function demoState() {
  return {
    version: 1,
    round: 1,
    draculaHp: 12,
    winner: null,
    assets: { tokens: 3, trumpToken: true },
    zones: {
      Z1: { id: "Z1", humans: 4, vampires: 0 },
      Z2: { id: "Z2", humans: 4, vampires: 0 },
      Z3: { id: "Z3", humans: 4, vampires: 0 },
      Z4: { id: "Z4", humans: 4, vampires: 0 },
      Z5: { id: "Z5", humans: 4, vampires: 0 }
    },
    players: {
      P1: { playerId: "P1" },
      P2: { playerId: "P2" }
    }
  } as const;
}
