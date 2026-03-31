import { describe, it, expect, beforeEach } from 'vitest';
import type { Card, CardId } from '@sgs/data';
import type { GameState } from '../state/game.js';
import type { PlayerState } from '../state/player.js';
import type { PlayerId } from '../state/types.js';
import { TargetSelector } from './target-selector.js';

function makePlayer(id: string, seat: number): PlayerState {
  return {
    id: id as PlayerId,
    name: `Player ${id}`,
    seat,
    mainGeneral: null,
    deputyGeneral: null,
    hp: 4,
    maxHp: 4,
    handCards: [],
    equipment: {
      weapon: null,
      armor: null,
      defensiveHorse: null,
      offensiveHorse: null,
      treasure: null,
    },
    judgmentArea: [],
    faction: null,
    alive: true,
    skills: [],
    marks: {},
  };
}

function makeGame(players: PlayerState[]): GameState {
  return {
    players,
    drawPile: [],
    discardPile: [],
    currentPlayerIndex: 0,
    currentPhase: 'play',
    turnCount: 1,
    activeEffects: [],
    gameOver: false,
    winnerFaction: null,
  };
}

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'card_01' as CardId,
    name: '杀',
    type: 'basic',
    suit: 'spade',
    number: 7,
    description: '',
    ...overrides,
  };
}

function makeWeapon(range: number, name = '武器'): Card {
  return makeCard({
    id: `weapon_${range}` as CardId,
    name,
    type: 'equipment',
    subtype: 'weapon',
    range,
  });
}

function makeHorse(subtype: 'defensiveHorse' | 'offensiveHorse'): Card {
  return makeCard({
    id: `horse_${subtype}` as CardId,
    name: subtype === 'defensiveHorse' ? '+1马' : '-1马',
    type: 'equipment',
    subtype,
  });
}

describe('TargetSelector', () => {
  let selector: TargetSelector;

  beforeEach(() => {
    selector = new TargetSelector();
  });

  describe('getDistance — 4-player circular seating', () => {
    // Seats: p1(0) - p2(1) - p3(2) - p4(3)
    let p1: PlayerState, p2: PlayerState, p3: PlayerState, p4: PlayerState;
    let game: GameState;

    beforeEach(() => {
      p1 = makePlayer('p1', 0);
      p2 = makePlayer('p2', 1);
      p3 = makePlayer('p3', 2);
      p4 = makePlayer('p4', 3);
      game = makeGame([p1, p2, p3, p4]);
    });

    it('distance to self is 0', () => {
      expect(selector.getDistance(game, p1, p1)).toBe(0);
    });

    it('adjacent players have distance 1', () => {
      expect(selector.getDistance(game, p1, p2)).toBe(1);
      expect(selector.getDistance(game, p2, p1)).toBe(1);
      expect(selector.getDistance(game, p3, p4)).toBe(1);
      expect(selector.getDistance(game, p4, p1)).toBe(1); // wrap-around
    });

    it('opposite players have distance 2 in a 4-player game', () => {
      expect(selector.getDistance(game, p1, p3)).toBe(2);
      expect(selector.getDistance(game, p2, p4)).toBe(2);
    });

    it('is symmetric between two players', () => {
      expect(selector.getDistance(game, p1, p3)).toBe(
        selector.getDistance(game, p3, p1),
      );
    });

    it('skips dead players for distance', () => {
      // Kill p2 — alive ring is p1(0), p3(2), p4(3)
      p2.alive = false;
      // p1→p3: clockwise 1 step, counterclockwise 2 steps → 1
      expect(selector.getDistance(game, p1, p3)).toBe(1);
      // p1→p4: clockwise 2, counterclockwise 1 → 1
      expect(selector.getDistance(game, p1, p4)).toBe(1);
    });
  });

  describe('horse modifiers affect distance', () => {
    let p1: PlayerState, p2: PlayerState, p3: PlayerState;
    let game: GameState;

    beforeEach(() => {
      p1 = makePlayer('p1', 0);
      p2 = makePlayer('p2', 1);
      p3 = makePlayer('p3', 2);
      game = makeGame([p1, p2, p3]);
    });

    it('defensive horse on target increases distance by 1', () => {
      // Base: p1→p2 = 1
      expect(selector.getDistance(game, p1, p2)).toBe(1);
      p2.equipment.defensiveHorse = makeHorse('defensiveHorse');
      expect(selector.getDistance(game, p1, p2)).toBe(2);
    });

    it('offensive horse on attacker decreases distance by 1', () => {
      // Base: p1→p3 = 1 (in 3-player ring, both directions = 1 or 2, min=1)
      // Actually in 3-player ring: p1→p3 clockwise=2, ccw=1, min=1
      expect(selector.getDistance(game, p1, p3)).toBe(1);
      // With offensive horse, distance = 1 - 1 = 0, clamped to 1
      p1.equipment.offensiveHorse = makeHorse('offensiveHorse');
      expect(selector.getDistance(game, p1, p3)).toBe(1);
    });

    it('offensive horse reduces distance but minimum is 1', () => {
      // p1→p2 base distance = 1, with -1 horse → 0, clamped to 1
      p1.equipment.offensiveHorse = makeHorse('offensiveHorse');
      expect(selector.getDistance(game, p1, p2)).toBe(1);
    });

    it('both horses combine correctly', () => {
      // p1→p2 base = 1; +1 def on p2 → 2; -1 off on p1 → 1
      p1.equipment.offensiveHorse = makeHorse('offensiveHorse');
      p2.equipment.defensiveHorse = makeHorse('defensiveHorse');
      expect(selector.getDistance(game, p1, p2)).toBe(1);
    });
  });

  describe('weapon range determines attack targets', () => {
    let p1: PlayerState, p2: PlayerState, p3: PlayerState, p4: PlayerState;
    let game: GameState;

    beforeEach(() => {
      p1 = makePlayer('p1', 0);
      p2 = makePlayer('p2', 1);
      p3 = makePlayer('p3', 2);
      p4 = makePlayer('p4', 3);
      game = makeGame([p1, p2, p3, p4]);
    });

    it('default attack range is 1 without weapon', () => {
      expect(selector.getAttackRange(p1)).toBe(1);
    });

    it('without weapon, can only attack adjacent players', () => {
      const targets = selector.getAttackTargets(game, p1);
      const ids = targets.map((t) => t.id);
      expect(ids).toContain('p2');
      expect(ids).toContain('p4'); // wrap-around adjacent
      expect(ids).not.toContain('p3'); // distance 2
    });

    it('weapon range 2 extends attack targets', () => {
      p1.equipment.weapon = makeWeapon(2, '青釭剑');
      expect(selector.getAttackRange(p1)).toBe(2);
      const targets = selector.getAttackTargets(game, p1);
      const ids = targets.map((t) => t.id);
      expect(ids).toContain('p2');
      expect(ids).toContain('p3'); // now reachable at distance 2
      expect(ids).toContain('p4');
    });

    it('weapon range interacts with defensive horse', () => {
      // p1 has range-2 weapon, p2 has defensive horse
      // p1→p2 base=1, +1 def horse = 2, within range 2 → valid
      p1.equipment.weapon = makeWeapon(2);
      p2.equipment.defensiveHorse = makeHorse('defensiveHorse');
      const targets = selector.getAttackTargets(game, p1);
      expect(targets.map((t) => t.id)).toContain('p2');
    });

    it('weapon range insufficient with defensive horse', () => {
      // p1 has default range 1, p2 has defensive horse
      // p1→p2 base=1, +1 def = 2, range 1 → not reachable
      p2.equipment.defensiveHorse = makeHorse('defensiveHorse');
      const targets = selector.getAttackTargets(game, p1);
      expect(targets.map((t) => t.id)).not.toContain('p2');
    });

    it('dead players are not valid attack targets', () => {
      p2.alive = false;
      const targets = selector.getAttackTargets(game, p1);
      expect(targets.map((t) => t.id)).not.toContain('p2');
    });
  });

  describe('isValidTarget', () => {
    let p1: PlayerState, p2: PlayerState, p3: PlayerState;
    let game: GameState;

    beforeEach(() => {
      p1 = makePlayer('p1', 0);
      p2 = makePlayer('p2', 1);
      p3 = makePlayer('p3', 2);
      game = makeGame([p1, p2, p3]);
    });

    it('cannot target self', () => {
      const slash = makeCard();
      expect(selector.isValidTarget(game, p1, p1, slash)).toBe(false);
    });

    it('cannot target dead players', () => {
      p2.alive = false;
      const slash = makeCard();
      expect(selector.isValidTarget(game, p1, p2, slash)).toBe(false);
    });

    it('slash checks attack range', () => {
      const slash = makeCard({ name: '杀', type: 'basic' });
      // p1→p2 distance 1, range 1 → valid
      expect(selector.isValidTarget(game, p1, p2, slash)).toBe(true);
      // p1→p3 distance 1 in 3-player ring → valid
      expect(selector.isValidTarget(game, p1, p3, slash)).toBe(true);
    });

    it('trick cards can target any alive player', () => {
      const trick = makeCard({
        name: '过河拆桥',
        type: 'trick',
        subtype: 'instantTrick',
      });
      expect(selector.isValidTarget(game, p1, p2, trick)).toBe(true);
    });
  });

  describe('getTrickTargets', () => {
    it('returns all alive players except self', () => {
      const p1 = makePlayer('p1', 0);
      const p2 = makePlayer('p2', 1);
      const p3 = makePlayer('p3', 2);
      p3.alive = false;
      const game = makeGame([p1, p2, p3]);
      const trick = makeCard({ type: 'trick', subtype: 'instantTrick' });

      const selector = new TargetSelector();
      const targets = selector.getTrickTargets(game, p1, trick);
      const ids = targets.map((t) => t.id);
      expect(ids).toEqual(['p2']);
    });
  });
});
