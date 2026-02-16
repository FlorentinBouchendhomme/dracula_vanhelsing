import type { AssetState, CardColor, CardId, CardInstance, ZoneId } from "./types";

export const ZONE_IDS: readonly ZoneId[] = ["Z1", "Z2", "Z3", "Z4", "Z5"] as const;

export const GAME_LIMITS = {
  zonesCount: 5,
  tokensPerZone: 4,
  maxRounds: 5,
  draculaHpInitial: 12,
  assetTokensInitial: 3,
  trumpTokenInitial: true
} as const;

export const INITIAL_ASSETS: AssetState = {
  tokens: GAME_LIMITS.assetTokensInitial,
  trumpToken: GAME_LIMITS.trumpTokenInitial
};

export type CardMeta = Readonly<{
  id: CardId;
  color: CardColor;
  description: string;
}>;

const CARD_DESCRIPTIONS: Readonly<Record<CardId, string>> = {
  1: "Révélez une de vos cartes (au choix).",
  2: "Révélez la carte du dessus du paquet.",
  3: "Révélez une carte de votre adversaire (au choix).",
  4: "Echangez l'emplacement de deux de vos cartes.",
  5: "Rejouez (piochez et défaussez). Cet effet s'applique même si votre adversaire a annoncé la fin de la manche.",
  6: "Echangez une de vos cartes avec celle du même quartier de votre adversaire.",
  7: "Echangez le jeton Couleur de l'atout avec un autre jeton Couleur.",
  8: "Vous ne pouvez jouer cette carte que s'il y a au moins 6 cartes dans la défausse. Terminez immédiatement la manche. Votre adversaire ne joue pas son tour."
} as const;

export const CARD_COLORS: readonly CardColor[] = ["GREEN", "YELLOW", "RED", "BLUE"] as const;
export const CARD_IDS: readonly CardId[] = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export const CARD_LIST: readonly CardMeta[] = CARD_COLORS.flatMap((color) =>
  CARD_IDS.map((id) => ({
    id,
    color,
    description: CARD_DESCRIPTIONS[id]
  }))
);

export function makeCardKey(color: CardColor, id: CardId): string {
  return `${color}:${id}`;
}

export const CARD_BY_KEY: Readonly<Record<string, CardMeta>> = CARD_LIST.reduce(
  (acc, c) => {
    acc[makeCardKey(c.color, c.id)] = c;
    return acc;
  },
  {} as Record<string, CardMeta>
);

export function getCardMeta(card: CardInstance): CardMeta {
  const key = makeCardKey(card.color, card.id);
  const meta = CARD_BY_KEY[key];
  if (!meta) {
    // Throwing here is fine => this is a programming error, not a runtime user error.
    throw new Error(`Missing card meta for key => ${key}`);
  }
  return meta;
}
