export type CardId = string & { readonly __brand: 'CardId' };
export type CardType = 'basic' | 'trick' | 'equipment';
export type CardSubtype =
  | 'weapon'
  | 'armor'
  | 'defensiveHorse'
  | 'offensiveHorse'
  | 'treasure'
  | 'instantTrick'
  | 'delayedTrick';
export type Suit = 'spade' | 'heart' | 'club' | 'diamond';

export interface Card {
  id: CardId;
  name: string;
  type: CardType;
  subtype?: CardSubtype;
  suit: Suit;
  number: number;
  description: string;
  /**
   * 有卡面图的扩展牌（群狼环鼎新增的 21 张游戏牌）。标准牌无此字段。
   *
   * 这个字段同时是「标准牌 vs 扩展牌」的**唯一判据** —— `/cards` 页面和
   * `cards.test.ts` 都靠 `image == null` 筛出标准牌堆。不要另加 `pack` 字段：
   * 没有任何代码会读它，而现有 146 张标准牌也都没有该字段。
   */
  image?: string;
  range?: number;
  attackRange?: number;
}

export interface DeckCard extends Card {
  count: number;
}
