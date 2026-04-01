import type { Card, DeckCard } from '@sgs/data';

/**
 * Fisher-Yates (Knuth) in-place shuffle.
 */
function fisherYatesShuffle<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = array[i]!;
    array[i] = array[j]!;
    array[j] = tmp;
  }
}

export class DeckManager {
  readonly drawPile: Card[] = [];
  readonly discardPile: Card[] = [];

  /**
   * Build the draw pile from a Kingdom War deck composition.
   * Each DeckCard specifies a `count`; we expand it into individual Card entries
   * and shuffle the result.
   */
  initializeDeck(cards: DeckCard[]): void {
    this.drawPile.length = 0;
    this.discardPile.length = 0;

    for (const deckCard of cards) {
      const { count, ...card } = deckCard;
      for (let i = 0; i < count; i++) {
        this.drawPile.push({ ...card });
      }
    }

    this.shuffle();
  }

  /** Randomize the draw pile using Fisher-Yates. */
  shuffle(): void {
    fisherYatesShuffle(this.drawPile);
  }

  /** Draw `count` cards from the top of the draw pile. */
  draw(count: number): Card[] {
    if (count <= 0) {
      return [];
    }

    if (this.drawPile.length === 0) {
      this.recycleDiscard();
    }

    const available = Math.min(count, this.drawPile.length);
    return this.drawPile.splice(0, available);
  }

  /** Move cards to the discard pile. */
  discard(cards: Card[]): void {
    this.discardPile.push(...cards);
  }

  /** Shuffle the discard pile back into the draw pile (when draw pile is empty). */
  recycleDiscard(): void {
    this.drawPile.push(...this.discardPile);
    this.discardPile.length = 0;
    this.shuffle();
  }

  /** Number of cards remaining in the draw pile. */
  remaining(): number {
    return this.drawPile.length;
  }
}
