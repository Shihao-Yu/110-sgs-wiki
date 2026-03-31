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
  range?: number;
  attackRange?: number;
}

export interface DeckCard extends Card {
  count: number;
}
