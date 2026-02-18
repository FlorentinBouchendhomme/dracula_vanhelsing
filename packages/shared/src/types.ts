export type PlayerId = "P1" | "P2";

export type ZoneId = "Z1" | "Z2" | "Z3" | "Z4" | "Z5";

export type TokenKind = "HUMAN" | "VAMPIRE";

export type CardColor = "GREEN" | "RED" | "BLUE" | "YELLOW";

export type CardId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type CardInstance = Readonly<{
  id: CardId;
  color: CardColor;
}>;

export type CardVisibility = "HIDDEN" | "VISIBLE";

export type RevealedCardKeys = Readonly<Record<string, true>>;

export type RoundCounter = 1 | 2 | 3 | 4 | 5;

export type RoomCode = string;

export interface ZoneState {
  id: ZoneId;
  humans: number; // 0..4
  vampires: number; // 0..4
}

export type Role = "DRACULA" | "VAN_HELSING";

export type RolesByPlayer = Record<PlayerId, Role>;

export interface PlayerAreaState {
  playerId: PlayerId;
}

export type PlayerLayout = Record<
  ZoneId,
  {
    card: CardInstance;
    visibility: CardVisibility;
  }
>;

export type DeckState = Readonly<{
  draw: readonly CardInstance[];
  discard: readonly CardInstance[];
}>;

export type TrumpOrder = {
  nonTrumps: [CardColor, CardColor, CardColor];
  trump: CardColor;
};

export interface AssetState {
  order: TrumpOrder;
}

export type RoundEndReason = "CARD_8" | "DECK_EMPTY" | null;

export type TurnPhase = "DRAW" | "CHOOSE" | "EFFECT";

export type LogEntry = Readonly<{
  id: string;
  ts: number;
  text: string;
}>;

export type EffectPrompt = null | Readonly<{
  kind: "REVEAL_OWN" | "REVEAL_OPP";
  actor: PlayerId;
}>;

export interface GameState {
  version: number;
  round: RoundCounter;

  draculaHp: number;
  zones: Record<ZoneId, ZoneState>;
  assets: AssetState;

  players: Record<PlayerId, PlayerAreaState>;

  layouts: Record<PlayerId, PlayerLayout>;
  deck: DeckState;

  activePlayer: PlayerId;
  roundEnded: boolean;
  roundEndReason: RoundEndReason;
  skipNextTurn: boolean; // used by card 8

  turnPhase: TurnPhase;
  drawnCard: CardInstance | null;

  roles: RolesByPlayer;

  log: readonly LogEntry[];
  effectPrompt: EffectPrompt;
  revealed: RevealedCardKeys;

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
