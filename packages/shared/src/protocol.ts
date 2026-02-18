import type { GameState, PlayerId, RoomCode, RoomSummary, ZoneId } from "./types";

export type ClientMsgId = string;
export type ServerMsgId = string;

export type ErrorCode =
  | "BAD_JSON"
  | "BAD_MESSAGE"
  | "NOT_IMPLEMENTED"
  | "ROOM_NOT_FOUND"
  | "ROOM_FULL"
  | "INVALID_PLAYER_KEY"
  | "NOT_IN_ROOM"
  | "NOT_READY"
  | "INVALID_ACTION"
  | "STALE_STATE"
  | "INTERNAL_ERROR";

export interface Envelope<TType extends string, TPayload> {
  type: TType;
  id: ClientMsgId | ServerMsgId;
  ts: number; // Unix epoch ms
  payload: TPayload;
}

export interface ErrorPayload {
  code: ErrorCode;
  message: string;
  details?: unknown;
  refId?: string; // Optional => id of message that caused the error
}

export type UnknownAction =
  | {
      kind: "PLAY_CARD";
      payload: { actor: PlayerId; zoneId: ZoneId };
    }
  | {
      kind: "END_ROUND";
      payload?: unknown;
    }
  | {
      kind: "DAMAGE_DRACULA";
      payload: { amount: number };
    }
  | {
      kind: "TRANSFORM_IN_ZONE";
      payload: { zoneId: ZoneId; amount: number };
    }
  | {
      kind: "SET_ACTIVE_PLAYER";
      payload: { playerId: PlayerId };
    };

export type ClientToServer =
  | Envelope<
      "ROOM_CREATE",
      {
        name: string;
      }
    >
  | Envelope<
      "ROOM_JOIN",
      {
        code: RoomCode;
        playerKey: string | null; // null => new seat assignment
      }
    >
  | Envelope<
      "ROOM_LEAVE",
      {
        code: RoomCode;
      }
    >
  | Envelope<
      "PLAYER_READY",
      {
        code: RoomCode;
        isReady: boolean;
      }
    >
  | Envelope<
      "ACTION",
      {
        code: RoomCode;
        stateVersion: number;
        action: UnknownAction;
      }
    >
  | Envelope<
      "PING",
      {
        t: number;
      }
    >;

export type ServerToClient =
  | Envelope<
      "ROOM_CREATED",
      {
        code: RoomCode;
      }
    >
  | Envelope<
      "ROOM_JOINED",
      {
        code: RoomCode;
        playerId: PlayerId;
        playerKey: string; // Stored client-side for reconnect
      }
    >
  | Envelope<
      "ROOM_STATE",
      {
        room: RoomSummary;
      }
    >
  | Envelope<
      "STATE_SYNC",
      {
        code: RoomCode;
        state: GameState;
      }
    >
  | Envelope<"ERROR", ErrorPayload>
  | Envelope<
      "PONG",
      {
        t: number;
      }
    >;

export function isClientToServerMessage(value: unknown): value is ClientToServer {
  if (!value || typeof value !== "object") return false;
  const v = value as { type?: unknown; id?: unknown; ts?: unknown; payload?: unknown };
  return typeof v.type === "string" && typeof v.id === "string" && typeof v.ts === "number";
}

export function isServerToClientMessage(value: unknown): value is ServerToClient {
  if (!value || typeof value !== "object") return false;
  const v = value as { type?: unknown; id?: unknown; ts?: unknown; payload?: unknown };
  return typeof v.type === "string" && typeof v.id === "string" && typeof v.ts === "number";
}

export function makeClientEnvelope<TType extends ClientToServer["type"]>(
  type: TType,
  payload: Extract<ClientToServer, { type: TType }>["payload"],
  id: string
): Extract<ClientToServer, { type: TType }> {
  return { type, id, ts: Date.now(), payload } as Extract<ClientToServer, { type: TType }>;
}

export function makeServerEnvelope<TType extends ServerToClient["type"]>(
  type: TType,
  payload: Extract<ServerToClient, { type: TType }>["payload"],
  id: string
): Extract<ServerToClient, { type: TType }> {
  return { type, id, ts: Date.now(), payload } as Extract<ServerToClient, { type: TType }>;
}
