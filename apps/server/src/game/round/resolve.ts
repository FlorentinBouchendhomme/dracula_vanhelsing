import type { CardColor, CardInstance, PlayerId } from "@game/shared";
import type { TrumpOrder, ZoneId } from "@game/shared";

type ZoneCompare = Readonly<{
  winner: PlayerId | null;
  reason: string;
}>;

function colorRank(order: TrumpOrder, color: CardColor): number {
  // Lower index => higher priority
  const idx = order.nonTrumps.indexOf(color);
  return idx >= 0 ? idx : 999;
}

export function compareZoneCards(
  order: TrumpOrder,
  a: CardInstance,
  b: CardInstance,
  aPid: PlayerId,
  bPid: PlayerId
): ZoneCompare {
  const trump = order.trump;
  const aIsTrump = a.color === trump;
  const bIsTrump = b.color === trump;

  if (aIsTrump && !bIsTrump) return { winner: aPid, reason: "TRUMP_ONLY_ONE" };
  if (!aIsTrump && bIsTrump) return { winner: bPid, reason: "TRUMP_ONLY_ONE" };

  // both trump or none trump => compare id
  if (a.id > b.id) return { winner: aPid, reason: aIsTrump ? "TRUMP_HIGHER" : "HIGHER" };
  if (b.id > a.id) return { winner: bPid, reason: aIsTrump ? "TRUMP_HIGHER" : "HIGHER" };

  // tie on id (possible with different colors)
  // if both trump => same color => tie => draw
  if (aIsTrump && bIsTrump) return { winner: null, reason: "TRUMP_TIE" };

  // none trump and same id => compare by nonTrump order J1 > J2 > J3
  const ra = colorRank(order, a.color);
  const rb = colorRank(order, b.color);

  if (ra < rb) return { winner: aPid, reason: "ORDER_BREAK" };
  if (rb < ra) return { winner: bPid, reason: "ORDER_BREAK" };

  // Should be impossible with unique deck, but keep safe
  return { winner: null, reason: "FULL_TIE" };
}
