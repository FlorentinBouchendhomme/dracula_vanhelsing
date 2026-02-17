import { defineStore } from "pinia";
import { makeClientEnvelope } from "@game/shared";
import type {
  ClientToServer,
  GameState,
  PlayerId,
  RoomCode,
  RoomSummary,
  ServerToClient
} from "@game/shared";
import { WsClient } from "../net/ws";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

const STORAGE_KEY = "dvsh_playerKey";

export const useGameStore = defineStore("game", {
  state: () => ({
    status: "disconnected" as ConnectionStatus,

    roomCode: null as RoomCode | null,
    playerId: null as PlayerId | null,
    playerKey: null as string | null,

    room: null as RoomSummary | null,
    state: null as GameState | null,

    lastError: null as { code: string; message: string } | null,
    lastJoinAttemptCode: null as string | null,

    _ws: null as WsClient | null
  }),

  actions: {
    initWs(url = "ws://localhost:8787"): void {
      if (this._ws) return;

      this.playerKey = localStorage.getItem(STORAGE_KEY);

      this._ws = new WsClient(url, {
        onOpen: () => {
          this.status = "connected";
          const msg = makeClientEnvelope("PING", { t: Date.now() }, crypto.randomUUID());
          this._ws?.send(msg);
        },
        onClose: () => {
          this.status = "disconnected";
        },
        onError: () => {
          this.status = "error";
        },
        onMessage: (msg) => this.handleServerMessage(msg)
      });

      this.status = "connecting";
      this._ws.connect();
    },

    send(msg: ClientToServer): void {
      this._ws?.send(msg);
    },

    createRoom(name: string): void {
      const msg = makeClientEnvelope("ROOM_CREATE", { name }, crypto.randomUUID());
      this.send(msg);
    },

    joinRoom(code: string): void {
      const normalized = code.trim().toUpperCase();
      this.lastJoinAttemptCode = normalized;

      const msg = makeClientEnvelope(
        "ROOM_JOIN",
        { code: normalized, playerKey: this.playerKey },
        crypto.randomUUID()
      );
      this.send(msg);
    },

    leaveRoom(): void {
      if (!this.roomCode) return;
      const msg = makeClientEnvelope("ROOM_LEAVE", { code: this.roomCode }, crypto.randomUUID());
      this.send(msg);

      this.roomCode = null;
      this.playerId = null;
      this.room = null;
      this.state = null;
      this.lastError = null;
    },

    setReady(isReady: boolean): void {
      if (!this.roomCode) return;
      const msg = makeClientEnvelope(
        "PLAYER_READY",
        { code: this.roomCode, isReady },
        crypto.randomUUID()
      );
      this.send(msg);
    },

    handleServerMessage(msg: ServerToClient): void {
      switch (msg.type) {
        case "ROOM_CREATED": {
          this.roomCode = msg.payload.code;
          return;
        }

        case "ROOM_JOINED": {
          this.roomCode = msg.payload.code;
          this.playerId = msg.payload.playerId;
          this.playerKey = msg.payload.playerKey;
          localStorage.setItem(STORAGE_KEY, msg.payload.playerKey);
          return;
        }

        case "ROOM_STATE": {
          this.room = msg.payload.room;
          return;
        }

        case "STATE_SYNC": {
          this.roomCode = msg.payload.code;
          this.state = msg.payload.state;
          return;
        }

        case "ERROR": {
          this.lastError = { code: msg.payload.code, message: msg.payload.message };

          if (msg.payload.code === "INVALID_PLAYER_KEY" && this.lastJoinAttemptCode) {
            // Clear stale key (server restart or wrong room)
            this.playerKey = null;
            localStorage.removeItem(STORAGE_KEY);

            const retry = makeClientEnvelope(
              "ROOM_JOIN",
              { code: this.lastJoinAttemptCode, playerKey: null },
              crypto.randomUUID()
            );
            this.send(retry);
          }

          return;
        }

        case "PONG":
          return;

        default: {
          const _exhaustive: never = msg;
          return _exhaustive;
        }
      }
    }
  }
});
