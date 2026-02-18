import { defineStore } from "pinia";
import { makeClientEnvelope } from "@game/shared";
import type {
  ClientToServer,
  GameState,
  PlayerId,
  RoomCode,
  RoomSummary,
  ServerToClient,
  UnknownAction
} from "@game/shared";
import { WsClient } from "../net/ws";
import { makeId } from "../utils/uuid";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

type Notification = {
  id: string;
  level: "error" | "info";
  message: string;
};

const STORAGE_KEY = "dvsh_playerKey";

export const useGameStore = defineStore("game", {
  state: () => ({
    status: "disconnected" as ConnectionStatus,

    roomCode: null as RoomCode | null,
    playerId: null as PlayerId | null,
    playerKey: null as string | null,

    room: null as RoomSummary | null,
    state: null as GameState | null,

    notifications: [] as Notification[],
    lastJoinAttemptCode: null as string | null,

    selectedZoneId: null as import("@game/shared").ZoneId | null,
    selectedCardZoneId: null as import("@game/shared").ZoneId | null,

    _ws: null as WsClient | null
  }),

  actions: {
    initWs(url?: string): void {
      if (this._ws) return;

      this.playerKey = localStorage.getItem(STORAGE_KEY);

      const wsUrl = url ?? `ws://${window.location.hostname}:8787`;

      this._ws = new WsClient(wsUrl, {
        onOpen: () => {
          this.status = "connected";
          const msg = makeClientEnvelope("PING", { t: Date.now() }, makeId());
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

    pushNotification(level: "error" | "info", message: string): void {
      const id = makeId();
      this.notifications.push({ id, level, message });

      // Auto remove after 4 seconds
      setTimeout(() => {
        this.notifications = this.notifications.filter((n) => n.id !== id);
      }, 4000);
    },

    send(msg: ClientToServer): void {
      this._ws?.send(msg);
    },

    createRoom(name: string): void {
      const msg = makeClientEnvelope("ROOM_CREATE", { name }, makeId());
      this.send(msg);
    },

    joinRoom(code: string): void {
      const normalized = code.trim().toUpperCase();
      this.lastJoinAttemptCode = normalized;

      const msg = makeClientEnvelope(
        "ROOM_JOIN",
        { code: normalized, playerKey: this.playerKey },
        makeId()
      );
      this.send(msg);
    },

    leaveRoom(): void {
      if (!this.roomCode) return;
      const msg = makeClientEnvelope("ROOM_LEAVE", { code: this.roomCode }, makeId());
      this.send(msg);

      this.roomCode = null;
      this.playerId = null;
      this.room = null;
      this.state = null;
    },

    selectZone(zoneId: import("@game/shared").ZoneId): void {
      this.selectedZoneId = zoneId;
    },

    selectCardZone(zoneId: import("@game/shared").ZoneId): void {
      this.selectedCardZoneId = zoneId;
      this.selectedZoneId = zoneId;
    },

    clearSelection(): void {
      this.selectedZoneId = null;
      this.selectedCardZoneId = null;
    },

    canAct(): boolean {
      if (!this.state || !this.playerId || !this.roomCode) return false;
      if (this.status !== "connected") return false;
      if (this.state.winner) return false;
      if (this.state.roundEnded) return false;
      if (this.state.activePlayer !== this.playerId) return false;

      const slot = this.room?.slots?.[this.playerId];
      if (!slot?.isReady) return false;

      return true;
    },

    drawCard(): void {
      if (!this.state || !this.roomCode || !this.playerId) return;
      if (!this.canAct()) return;
      if (this.state.turnPhase !== "DRAW") return;

      const action: UnknownAction = {
        kind: "DRAW_CARD",
        payload: { actor: this.playerId }
      };

      const msg = makeClientEnvelope(
        "ACTION",
        {
          code: this.roomCode,
          stateVersion: this.state.version,
          action
        },
        makeId()
      );

      this.send(msg);
    },

    resolveChoice(keepDrawn: boolean, zoneId?: import("@game/shared").ZoneId): void {
      if (!this.state || !this.roomCode || !this.playerId) return;
      if (this.state.turnPhase !== "CHOOSE") return;

      let action: UnknownAction;

      if (keepDrawn) {
        if (!zoneId) return;

        action = {
          kind: "RESOLVE_CHOICE",
          payload: {
            actor: this.playerId,
            keepDrawn: true,
            zoneId
          }
        };
      } else {
        action = {
          kind: "RESOLVE_CHOICE",
          payload: {
            actor: this.playerId,
            keepDrawn: false
          }
        };
      }

      const msg = makeClientEnvelope(
        "ACTION",
        {
          code: this.roomCode,
          stateVersion: this.state.version,
          action
        },
        makeId()
      );

      this.send(msg);
    },
    setReady(isReady: boolean): void {
      if (!this.roomCode) return;
      const msg = makeClientEnvelope("PLAYER_READY", { code: this.roomCode, isReady }, makeId());
      this.send(msg);
    },

    handleServerMessage(msg: ServerToClient): void {
      switch (msg.type) {
        case "ROOM_CREATED": {
          this.roomCode = msg.payload.code;
          this.pushNotification("info", `Room créé ${msg.payload.code}`);

          return;
        }

        case "ROOM_JOINED": {
          this.roomCode = msg.payload.code;
          this.playerId = msg.payload.playerId;
          this.playerKey = msg.payload.playerKey;
          localStorage.setItem(STORAGE_KEY, msg.payload.playerKey);
          this.pushNotification("info", `Joined room ${msg.payload.code}`);
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
          this.pushNotification("error", `${msg.payload.code} - ${msg.payload.message}`);

          if (msg.payload.code === "INVALID_PLAYER_KEY" && this.lastJoinAttemptCode) {
            // Clear stale key (server restart or wrong room)
            this.playerKey = null;
            localStorage.removeItem(STORAGE_KEY);

            const retry = makeClientEnvelope(
              "ROOM_JOIN",
              { code: this.lastJoinAttemptCode, playerKey: null },
              makeId()
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
