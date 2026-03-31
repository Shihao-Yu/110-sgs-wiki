import { describe, it, expect, beforeEach } from 'vitest';
import type { CardId } from '@sgs/data';
import type { GameState } from '../state/game.js';
import type { PlayerState } from '../state/player.js';
import type { PlayerId } from '../state/types.js';
import type { GameEvent } from './types.js';
import { ResolutionStack } from './resolution-stack.js';

function makePlayer(id = 'p1'): PlayerState {
  return {
    id: id as PlayerId,
    name: `Player ${id}`,
    seat: 0,
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

function makeGame(): GameState {
  return {
    players: [makePlayer('p1'), makePlayer('p2')],
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

function makeCard(name: string) {
  return {
    id: `card-${name}` as CardId,
    name,
    type: 'basic' as const,
    suit: 'heart' as const,
    number: 1,
    description: name,
  };
}

const p1 = 'p1' as PlayerId;
const p2 = 'p2' as PlayerId;

describe('ResolutionStack', () => {
  let stack: ResolutionStack;
  let game: GameState;

  beforeEach(() => {
    stack = new ResolutionStack();
    game = makeGame();
  });

  describe('basic LIFO operations', () => {
    it('resolves 3 events in LIFO order', () => {
      const eventA: GameEvent = { type: 'drawCards', player: p1, count: 2 };
      const eventB: GameEvent = { type: 'recover', target: p1, amount: 1 };
      const eventC: GameEvent = { type: 'loseHp', player: p2, amount: 1 };

      stack.push(eventA);
      stack.push(eventB);
      stack.push(eventC);

      expect(stack.size).toBe(3);
      expect(stack.peek()).toBe(eventC);

      const r1 = stack.resolve(game);
      const r2 = stack.resolve(game);
      const r3 = stack.resolve(game);

      expect(r1).toBe(eventC);
      expect(r2).toBe(eventB);
      expect(r3).toBe(eventA);
      expect(stack.isEmpty()).toBe(true);
    });

    it('returns undefined when resolving an empty stack', () => {
      expect(stack.resolve(game)).toBeUndefined();
      expect(stack.isEmpty()).toBe(true);
    });

    it('resolveAll drains the stack in LIFO order', () => {
      const events: GameEvent[] = [
        { type: 'drawCards', player: p1, count: 1 },
        { type: 'drawCards', player: p1, count: 2 },
        { type: 'drawCards', player: p1, count: 3 },
      ];
      for (const e of events) stack.push(e);

      const resolved = stack.resolveAll(game);

      expect(resolved).toEqual([events[2], events[1], events[0]]);
      expect(stack.isEmpty()).toBe(true);
    });
  });

  describe('nested triggers', () => {
    it('event A triggers event B during resolution — B resolves before A continues', () => {
      const resolved: string[] = [];

      const damageEvent: GameEvent = {
        type: 'damage',
        source: p1,
        target: p2,
        amount: 1,
      };
      const skillEvent: GameEvent = {
        type: 'useSkill',
        player: p2,
        skillId: 'guicai',
        targets: [p1],
      };

      stack.onResolve((event, s) => {
        if (event.type === 'damage') {
          resolved.push('damage:start');
          // Damage triggers a skill (nested)
          s.push(skillEvent);
        } else if (event.type === 'useSkill') {
          resolved.push('skill:resolved');
        }
      });

      stack.push(damageEvent);

      // Resolve damage — handler pushes skill onto stack
      stack.resolve(game);
      expect(resolved).toEqual(['damage:start']);

      // Now skill is on top — resolve it next (LIFO)
      stack.resolve(game);
      expect(resolved).toEqual(['damage:start', 'skill:resolved']);

      expect(stack.isEmpty()).toBe(true);
    });

    it('deeply nested triggers resolve in correct LIFO order', () => {
      const order: string[] = [];

      stack.onResolve((event, s) => {
        if (event.type === 'playCard') {
          order.push('playCard');
          s.push({ type: 'damage', source: p1, target: p2, amount: 1 });
        } else if (event.type === 'damage') {
          order.push('damage');
          s.push({ type: 'loseHp', player: p2, amount: 1 });
        } else if (event.type === 'loseHp') {
          order.push('loseHp');
        }
      });

      const sha = makeCard('杀');
      stack.push({ type: 'playCard', player: p1, card: sha, targets: [p2] });

      // Each resolve triggers the next event
      stack.resolve(game); // playCard → pushes damage
      stack.resolve(game); // damage → pushes loseHp
      stack.resolve(game); // loseHp

      expect(order).toEqual(['playCard', 'damage', 'loseHp']);
      expect(stack.isEmpty()).toBe(true);
    });
  });

  describe('response windows', () => {
    it('pauses resolution when a response window is open', () => {
      const damageEvent: GameEvent = {
        type: 'damage',
        source: p1,
        target: p2,
        amount: 1,
      };
      const deathCheck: GameEvent = { type: 'loseHp', player: p2, amount: 1 };

      stack.push(deathCheck);
      stack.push(damageEvent);

      // Open a response window asking p2 to play 桃
      stack.onResolve((event, s) => {
        if (event.type === 'damage') {
          s.openResponseWindow(p2, event, [
            { label: '桃 (peach)', card: makeCard('桃') },
          ]);
        }
      });

      // Resolve damage — opens response window
      stack.resolve(game);
      expect(stack.isWaitingForResponse).toBe(true);
      expect(stack.currentWindow?.player).toBe(p2);

      // Stack is blocked — resolve returns undefined
      expect(stack.resolve(game)).toBeUndefined();

      // Player responds with a peach
      stack.submitResponse(p2, { accepted: true, card: makeCard('桃') });
      expect(stack.isWaitingForResponse).toBe(false);

      // Response event is now on the stack, resolve it
      const responseEvent = stack.resolve(game);
      expect(responseEvent?.type).toBe('response');
      if (responseEvent?.type === 'response') {
        expect(responseEvent.accepted).toBe(true);
        expect(responseEvent.card?.name).toBe('桃');
      }

      // Now the original deathCheck can resolve
      const loseHpEvent = stack.resolve(game);
      expect(loseHpEvent?.type).toBe('loseHp');
      expect(stack.isEmpty()).toBe(true);
    });

    it('throws when submitting a response with no open window', () => {
      expect(() =>
        stack.submitResponse(p1, { accepted: false }),
      ).toThrow('No response window is open');
    });

    it('throws when wrong player submits a response', () => {
      stack.push({ type: 'damage', source: p1, target: p2, amount: 1 });
      stack.openResponseWindow(p2, stack.peek()!, [{ label: '闪' }]);

      expect(() =>
        stack.submitResponse(p1, { accepted: true }),
      ).toThrow('Response window is for player p2, not p1');
    });

    it('player declines response — resolution continues', () => {
      const damage: GameEvent = { type: 'damage', source: p1, target: p2, amount: 1 };
      stack.push(damage);

      stack.onResolve((event, s) => {
        if (event.type === 'damage') {
          s.openResponseWindow(p2, event, [{ label: '闪 (dodge)' }]);
        }
      });

      stack.resolve(game); // resolves damage, opens window
      expect(stack.isWaitingForResponse).toBe(true);

      stack.submitResponse(p2, { accepted: false });
      expect(stack.isWaitingForResponse).toBe(false);

      const response = stack.resolve(game);
      expect(response?.type).toBe('response');
      if (response?.type === 'response') {
        expect(response.accepted).toBe(false);
      }

      expect(stack.isEmpty()).toBe(true);
    });
  });
});
