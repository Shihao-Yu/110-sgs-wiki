import { describe, expect, it } from 'vitest';
import type { DeckCard } from '@sgs/data';
import { DeckManager } from './deck-manager.js';

function makeDeckCard(overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    id: 'card-1' as DeckCard['id'],
    name: '杀',
    type: 'basic',
    suit: 'spade',
    number: 1,
    description: 'A basic attack card',
    count: 1,
    ...overrides,
  };
}

function makeMultipleCards(n: number): DeckCard[] {
  return Array.from({ length: n }, (_, i) =>
    makeDeckCard({
      id: `card-${i}` as DeckCard['id'],
      number: i + 1,
      count: 1,
    }),
  );
}

describe('DeckManager', () => {
  it('draw reduces pile count', () => {
    const manager = new DeckManager();
    const cards = makeMultipleCards(5);
    manager.initializeDeck(cards);

    expect(manager.remaining()).toBe(5);

    const drawn = manager.draw(2);
    expect(drawn).toHaveLength(2);
    expect(manager.remaining()).toBe(3);
  });

  it('discard adds cards to the discard pile', () => {
    const manager = new DeckManager();
    const cards = makeMultipleCards(3);
    manager.initializeDeck(cards);

    const drawn = manager.draw(2);
    expect(manager.discardPile).toHaveLength(0);

    manager.discard(drawn);
    expect(manager.discardPile).toHaveLength(2);
  });

  it('recycleDiscard shuffles discard into draw when empty', () => {
    const manager = new DeckManager();
    const cards = makeMultipleCards(4);
    manager.initializeDeck(cards);

    // Drain the draw pile completely
    const allDrawn = manager.draw(4);
    expect(manager.remaining()).toBe(0);

    // Discard them
    manager.discard(allDrawn);
    expect(manager.discardPile).toHaveLength(4);

    // Recycle
    manager.recycleDiscard();
    expect(manager.remaining()).toBe(4);
    expect(manager.discardPile).toHaveLength(0);
  });

  it('shuffle produces different orderings (statistical)', () => {
    // With 10 cards the chance of an identical ordering after shuffle is 1/10! (~1 in 3.6M).
    // We run 5 shuffles and expect at least one to differ from the original.
    const manager = new DeckManager();
    const cards = makeMultipleCards(10);

    // Initialize without shuffle to get a baseline ordering
    manager.drawPile.length = 0;
    for (const dc of cards) {
      const { count, ...card } = dc;
      for (let i = 0; i < count; i++) {
        manager.drawPile.push({ ...card });
      }
    }

    const originalOrder = manager.drawPile.map((c) => c.id).join(',');

    let foundDifferent = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      manager.shuffle();
      const newOrder = manager.drawPile.map((c) => c.id).join(',');
      if (newOrder !== originalOrder) {
        foundDifferent = true;
        break;
      }
    }

    expect(foundDifferent).toBe(true);
  });

  it('draw auto-recycles when draw pile is empty', () => {
    const manager = new DeckManager();
    const cards = makeMultipleCards(3);
    manager.initializeDeck(cards);

    // Drain and discard
    const firstDraw = manager.draw(3);
    manager.discard(firstDraw);
    expect(manager.remaining()).toBe(0);

    // Drawing now should auto-recycle from discard
    const secondDraw = manager.draw(2);
    expect(secondDraw).toHaveLength(2);
    expect(manager.remaining()).toBe(1);
    expect(manager.discardPile).toHaveLength(0);
  });

  it('initializeDeck expands count into individual cards', () => {
    const manager = new DeckManager();
    const deckCards: DeckCard[] = [
      makeDeckCard({ id: 'slash-1' as DeckCard['id'], count: 3 }),
      makeDeckCard({ id: 'dodge-1' as DeckCard['id'], name: '闪', count: 2 }),
    ];

    manager.initializeDeck(deckCards);
    expect(manager.remaining()).toBe(5);
  });
});
