import { describe, it, expect, beforeEach } from 'vitest';
import type { Card, CardId, Faction } from '@sgs/data';
import type { GameState } from '../state/game.js';
import type { PlayerState } from '../state/player.js';
import type { PlayerId } from '../state/types.js';
import { ResolutionStack } from '../resolution/resolution-stack.js';
import { DamageManager } from './damage-manager.js';

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

describe('DamageManager', () => {
  let stack: ResolutionStack;
  let dm: DamageManager;
  let p1: PlayerState;
  let p2: PlayerState;
  let game: GameState;

  beforeEach(() => {
    stack = new ResolutionStack();
    dm = new DamageManager(stack);
    p1 = makePlayer('p1', 0);
    p2 = makePlayer('p2', 1);
    game = makeGame([p1, p2]);
  });

  describe('dealDamage', () => {
    it('reduces target HP by damage amount', () => {
      dm.dealDamage(game, {
        source: p1.id,
        target: p2.id,
        amount: 2,
      });

      expect(p2.hp).toBe(2);
    });

    it('pushes a damage event onto the resolution stack', () => {
      dm.dealDamage(game, {
        source: p1.id,
        target: p2.id,
        amount: 1,
        element: 'fire',
      });

      const event = stack.peek();
      expect(event).toMatchObject({
        type: 'damage',
        source: p1.id,
        target: p2.id,
        amount: 1,
        element: 'fire',
      });
    });

    it('does nothing if target is already dead', () => {
      p2.alive = false;
      dm.dealDamage(game, { target: p2.id, amount: 1 });
      expect(p2.hp).toBe(4);
    });

    it('works without a source (environmental damage)', () => {
      dm.dealDamage(game, { target: p2.id, amount: 1 });
      expect(p2.hp).toBe(3);
    });
  });

  describe('checkDeath', () => {
    it('returns true when alive player has HP <= 0', () => {
      p1.hp = 0;
      expect(dm.checkDeath(game, p1)).toBe(true);
    });

    it('returns true when alive player has negative HP', () => {
      p1.hp = -2;
      expect(dm.checkDeath(game, p1)).toBe(true);
    });

    it('returns false when player has positive HP', () => {
      expect(dm.checkDeath(game, p1)).toBe(false);
    });

    it('returns false when player is already dead', () => {
      p1.hp = 0;
      p1.alive = false;
      expect(dm.checkDeath(game, p1)).toBe(false);
    });
  });

  describe('death on damage', () => {
    it('marks player dead when HP reaches 0', () => {
      p2.hp = 1;
      dm.dealDamage(game, {
        source: p1.id,
        target: p2.id,
        amount: 1,
      });

      expect(p2.hp).toBe(0);
      expect(p2.alive).toBe(false);
    });

    it('marks player dead when HP goes negative', () => {
      p2.hp = 2;
      dm.dealDamage(game, {
        source: p1.id,
        target: p2.id,
        amount: 5,
      });

      expect(p2.hp).toBe(-3);
      expect(p2.alive).toBe(false);
    });

    it('pushes a death event onto the stack', () => {
      p2.hp = 1;
      dm.dealDamage(game, {
        source: p1.id,
        target: p2.id,
        amount: 1,
      });

      // Stack has damage event then death event (death pushed last = on top)
      const top = stack.peek();
      expect(top).toMatchObject({
        type: 'death',
        player: p2.id,
        killer: p1.id,
      });
    });
  });

  describe('recover', () => {
    it('increases HP by the given amount', () => {
      p1.hp = 2;
      dm.recover(game, p1, 1);
      expect(p1.hp).toBe(3);
    });

    it('caps recovery at maxHp', () => {
      p1.hp = 3;
      dm.recover(game, p1, 5);
      expect(p1.hp).toBe(4);
    });

    it('does nothing for dead players', () => {
      p1.hp = 0;
      p1.alive = false;
      dm.recover(game, p1, 3);
      expect(p1.hp).toBe(0);
    });

    it('pushes a recover event onto the stack', () => {
      p1.hp = 2;
      dm.recover(game, p1, 1);
      expect(stack.peek()).toMatchObject({
        type: 'recover',
        target: p1.id,
        amount: 1,
      });
    });
  });

  describe('resolveDeath — Kingdom War rewards/penalties', () => {
    it('same-faction kill: killer discards entire hand and all equipment', () => {
      const handCard = makeCard({ id: 'h1' as CardId, name: '桃' });
      const weapon = makeCard({
        id: 'w1' as CardId,
        name: '青龙偃月刀',
        type: 'equipment',
        subtype: 'weapon',
      });

      p1.faction = 'SHU' as Faction;
      p2.faction = 'SHU' as Faction;
      p1.handCards = [handCard];
      p1.equipment.weapon = weapon;

      p2.hp = 1;
      dm.dealDamage(game, {
        source: p1.id,
        target: p2.id,
        amount: 1,
      });

      // Killer (p1) should have discarded everything
      expect(p1.handCards).toEqual([]);
      expect(p1.equipment.weapon).toBeNull();
      // Cards moved to discard pile
      expect(game.discardPile).toContain(handCard);
      expect(game.discardPile).toContain(weapon);
    });

    it('cross-faction kill: killer draws 3 cards', () => {
      const drawCards = [
        makeCard({ id: 'd1' as CardId }),
        makeCard({ id: 'd2' as CardId }),
        makeCard({ id: 'd3' as CardId }),
      ];
      game.drawPile = [...drawCards];

      p1.faction = 'SHU' as Faction;
      p2.faction = 'WEI' as Faction;

      p2.hp = 1;
      dm.dealDamage(game, {
        source: p1.id,
        target: p2.id,
        amount: 1,
      });

      expect(p1.handCards).toHaveLength(3);
      expect(game.drawPile).toHaveLength(0);
    });

    it('no reward/penalty when factions are hidden (null)', () => {
      p1.faction = null;
      p2.faction = null;
      p1.handCards = [makeCard()];

      p2.hp = 1;
      dm.dealDamage(game, {
        source: p1.id,
        target: p2.id,
        amount: 1,
      });

      // No penalty — hand should be unchanged
      expect(p1.handCards).toHaveLength(1);
    });

    it('no reward/penalty when there is no killer', () => {
      p2.faction = 'WEI' as Faction;
      p2.hp = 1;

      dm.dealDamage(game, {
        target: p2.id,
        amount: 1,
      });

      expect(p2.alive).toBe(false);
      // No error thrown, no rewards/penalties
    });
  });

  describe('chain damage (铁索连环)', () => {
    let p3: PlayerState;

    beforeEach(() => {
      p3 = makePlayer('p3', 2);
      game = makeGame([p1, p2, p3]);
    });

    it('propagates elemental damage to other chained players', () => {
      p2.marks['chained'] = 1;
      p3.marks['chained'] = 1;

      dm.dealDamage(game, {
        source: p1.id,
        target: p2.id,
        amount: 1,
        element: 'fire',
      });

      // p2 takes 1 fire damage, chain propagates to p3
      expect(p2.hp).toBe(3);
      expect(p3.hp).toBe(3);
    });

    it('removes chained mark after chain resolves', () => {
      p2.marks['chained'] = 1;
      p3.marks['chained'] = 1;

      dm.dealDamage(game, {
        source: p1.id,
        target: p2.id,
        amount: 1,
        element: 'thunder',
      });

      expect(p2.marks['chained']).toBe(0);
      expect(p3.marks['chained']).toBe(0);
    });

    it('does not propagate non-elemental damage', () => {
      p2.marks['chained'] = 1;
      p3.marks['chained'] = 1;

      dm.dealDamage(game, {
        source: p1.id,
        target: p2.id,
        amount: 1,
      });

      expect(p2.hp).toBe(3);
      expect(p3.hp).toBe(4); // Not affected
      expect(p3.marks['chained']).toBe(1); // Still chained
    });

    it('does not propagate to unchained players', () => {
      p2.marks['chained'] = 1;
      // p3 is NOT chained

      dm.dealDamage(game, {
        source: p1.id,
        target: p2.id,
        amount: 1,
        element: 'fire',
      });

      expect(p2.hp).toBe(3);
      expect(p3.hp).toBe(4); // Not affected
    });

    it('chain damage can kill chained players', () => {
      p2.marks['chained'] = 1;
      p3.marks['chained'] = 1;
      p3.hp = 1;

      dm.dealDamage(game, {
        source: p1.id,
        target: p2.id,
        amount: 1,
        element: 'fire',
      });

      expect(p3.hp).toBe(0);
      expect(p3.alive).toBe(false);
    });
  });
});
