/**
 * 卡牌花色与点数的显示形式。
 *
 * 抽出来是因为原先三处各写了一份 SUIT_SIGN，而把点数转成 A/J/Q/K 的
 * displayNumber 只在 CardEntry 里私有 —— 结果群狼环鼎的牌显示成「♠13」，
 * 而卡面上印的是「♠K」。
 */

export const SUIT_SIGN: Record<string, string> = {
  spade: "♠",
  heart: "♥",
  club: "♣",
  diamond: "♦",
};

/** 1 → A，11/12/13 → J/Q/K，其余原样。 */
export function displayNumber(n: number): string {
  if (n === 1) return "A";
  if (n === 11) return "J";
  if (n === 12) return "Q";
  if (n === 13) return "K";
  return String(n);
}

/** 「♠K」这样的完整点数标签。 */
export function suitRank(suit: string, number: number): string {
  return `${SUIT_SIGN[suit] ?? ""}${displayNumber(number)}`;
}
