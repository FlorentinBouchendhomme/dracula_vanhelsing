export type PlayerId = "P1" | "P2";

export type ZoneId = "Z1" | "Z2" | "Z3" | "Z4" | "Z5";

export type TokenKind = "HUMAN" | "VAMPIRE";

export type CardColor = "GREEN" | "RED" | "BLUE" | "YELLOW";

export type CardId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type RoundCounter = 1 | 2 | 3 | 4 | 5;

export type RoomCode = string;

export interface ZoneState {
  id: ZoneId;
  humans: number; // 0..4
  vampires: number; // 0..4
}

export interface PlayerAreaState {
  playerId: PlayerId;
}

export interface AssetState {
  tokens: number; // 0..3
  trumpToken: boolean;
}

export interface GameState {
  version: number;
  round: RoundCounter;
  draculaHp: number; // target => 0 for Van Helsing win
  zones: Record<ZoneId, ZoneState>;
  assets: AssetState;
  players: Record<PlayerId, PlayerAreaState>;
  winner: null | PlayerId;
}

export interface RoomSlot {
  playerId: PlayerId;
  isConnected: boolean;
  isReady: boolean;
}

export interface RoomSummary {
  code: RoomCode;
  slots: Record<PlayerId, RoomSlot>;
}