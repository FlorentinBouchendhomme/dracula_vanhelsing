import { WebSocketServer, type WebSocket } from "ws";
import {
  makeServerEnvelope,
  isClientToServerMessage,
  type ClientToServer,
  type ServerToClient
} from "@game/shared";
import type { ErrorCode } from "@game/shared";

const PORT = Number(process.env.PORT ?? 8787);

const wss = new WebSocketServer({ port: PORT });

function send(ws: WebSocket, msg: ServerToClient): void {
  ws.send(JSON.stringify(msg));
}

function sendError(
  ws: WebSocket,
  refId: string | undefined,
  code: ErrorCode,
  message: string
): void {
  const payload = refId === undefined ? { code, message } : { code, message, refId };

  send(ws, makeServerEnvelope("ERROR", payload, cryptoId()));
}

wss.on("connection", (ws) => {
  // Skeleton => push a demo STATE_SYNC without room handling for now
  send(
    ws,
    makeServerEnvelope(
      "STATE_SYNC",
      {
        code: "DEMO",
        state: demoState()
      },
      cryptoId()
    )
  );

  ws.on("message", (data) => {
    const raw = data.toString();
    const parsed = safeParse<unknown>(raw);

    if (!parsed) {
      sendError(ws, undefined, "BAD_JSON", "Invalid JSON message");
      return;
    }

    if (!isClientToServerMessage(parsed)) {
      sendError(ws, undefined, "BAD_MESSAGE", "Message does not match envelope shape");
      return;
    }

    const msg = parsed as ClientToServer;

    if (msg.type === "PING") {
      send(
        ws,
        makeServerEnvelope(
          "PONG",
          {
            t: msg.payload.t
          },
          cryptoId()
        )
      );
      return;
    }

    sendError(ws, msg.id, "NOT_IMPLEMENTED", "Server skeleton only");
  });
});

console.log(`WS server listening => ws://localhost:${PORT}`);

function safeParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function cryptoId(): string {
  return crypto.randomUUID();
}

function demoState() {
  return {
    version: 1,
    round: 1,
    draculaHp: 12,
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
    },

    layouts: {
      P1: {
        Z1: { color: "GREEN", id: 1 },
        Z2: { color: "GREEN", id: 2 },
        Z3: { color: "GREEN", id: 3 },
        Z4: { color: "GREEN", id: 4 },
        Z5: { color: "GREEN", id: 5 }
      },
      P2: {
        Z1: { color: "RED", id: 1 },
        Z2: { color: "RED", id: 2 },
        Z3: { color: "RED", id: 3 },
        Z4: { color: "RED", id: 4 },
        Z5: { color: "RED", id: 5 }
      }
    },

    deck: {
      draw: [],
      discard: []
    },

    activePlayer: "P1",
    roundEnded: false,

    winner: null
  } as const;
}
