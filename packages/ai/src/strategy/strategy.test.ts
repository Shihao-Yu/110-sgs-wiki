import { describe, it, expect } from 'vitest';
import type { Card, CardId, General, GeneralId, Skill, SkillId } from '@sgs/data';
import type { GameState, PlayerState, PlayerId } from '@sgs/engine';
import { BaseAI } from './base-ai.js';
import { GeneralEvaluator } from './evaluator.js';

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

function makePlayer(id: string, overrides: Partial<PlayerState> = {}): PlayerState {
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
    ...overrides,
  };
}

function makeCard(name: string, overrides: Partial<Card> = {}): Card {
  return {
    id: `card_${name}` as CardId,
    name,
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

function makeSkill(id: string, description: string, overrides: Partial<Skill> = {}): Skill {
  return {
    id: id as SkillId,
    name: id,
    description,
    type: 'passive',
    timing: [],
    generalIds: [],
    faq: [],
    ...overrides,
  };
}

function makeGeneral(
  id: string,
  skillIds: string[],
  overrides: Partial<General> = {},
): General {
  return {
    id: id as GeneralId,
    name: id,
    title: '',
    faction: 'WEI',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    skills: skillIds as SkillId[],
    image: '',
    pack: 'test',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BaseAI', () => {
  const ai = new BaseAI();

  describe('evaluateDiscard — selects lowest value cards', () => {
    it('discards lowest-value cards first', () => {
      const player = makePlayer('p1', {
        handCards: [
          makeCard('桃'),   // value 9 — keep
          makeCard('闪'),   // value 7 — keep
          makeCard('杀'),   // value 4 — discard
          makeCard('闪电', { type: 'trick' }), // value 3 — discard
        ],
      });
      const game = makeGame([player]);

      const result = ai.evaluateDiscard(game, player, 2);

      expect(result.cards).toHaveLength(2);
      const discardedNames = result.cards.map((c) => c.name).sort();
      // Should discard the two lowest: 闪电 (3) and 杀 (4)
      expect(discardedNames).toEqual(['杀', '闪电']);
    });
  });

  describe('evaluateTarget — targets weakest enemy', () => {
    it('picks the enemy with lowest HP', () => {
      const me = makePlayer('me');
      const strong = makePlayer('strong', { hp: 4, maxHp: 4 });
      const weak = makePlayer('weak', { hp: 1, maxHp: 4 });
      const game = makeGame([me, strong, weak]);

      const result = ai.evaluateTarget(game, me, [
        strong.id,
        weak.id,
      ]);

      expect(result.targetId).toBe(weak.id);
    });

    it('breaks HP ties by fewest hand cards', () => {
      const me = makePlayer('me');
      const manyCards = makePlayer('many', {
        hp: 2,
        handCards: [makeCard('杀'), makeCard('杀'), makeCard('杀')],
      });
      const fewCards = makePlayer('few', {
        hp: 2,
        handCards: [makeCard('杀')],
      });
      const game = makeGame([me, manyCards, fewCards]);

      const result = ai.evaluateTarget(game, me, [
        manyCards.id,
        fewCards.id,
      ]);

      expect(result.targetId).toBe(fewCards.id);
    });
  });

  describe('evaluateResponse — contextual response decisions', () => {
    it('plays 闪 when available', () => {
      const player = makePlayer('p1', {
        handCards: [makeCard('闪'), makeCard('杀')],
      });
      const game = makeGame([player]);

      const result = ai.evaluateResponse(game, player, '闪');

      expect(result.respond).toBe(true);
      expect(result.card?.name).toBe('闪');
    });

    it('plays 桃 when HP is critical', () => {
      const player = makePlayer('p1', {
        hp: 0,
        handCards: [makeCard('桃'), makeCard('杀')],
      });
      const game = makeGame([player]);

      const result = ai.evaluateResponse(game, player, '桃');

      expect(result.respond).toBe(true);
      expect(result.card?.name).toBe('桃');
    });

    it('conserves 桃 when HP is healthy', () => {
      const player = makePlayer('p1', {
        hp: 4,
        handCards: [makeCard('桃'), makeCard('杀')],
      });
      const game = makeGame([player]);

      const result = ai.evaluateResponse(game, player, '桃');

      expect(result.respond).toBe(false);
    });
  });

  describe('scoreHand — card evaluation ranks 桃 > 闪 > 杀 at low HP', () => {
    it('ranks 桃 > 闪 > 杀 when player is at low HP', () => {
      const player = makePlayer('p1', {
        hp: 1,
        maxHp: 4,
        handCards: [
          makeCard('杀'),
          makeCard('闪'),
          makeCard('桃'),
        ],
      });

      const scored = ai.scoreHand(player);
      const names = scored.map((s) => s.card.name);

      // 桃 should be first (highest), 闪 second, 杀 last
      expect(names).toEqual(['桃', '闪', '杀']);
    });
  });
});

describe('GeneralEvaluator', () => {
  describe('evaluateGeneral — scores a known general correctly', () => {
    it('scores Guo Jia (郭嘉) high on draw', () => {
      // 天妒: "当你的判定牌生效后，你可以获得此判定牌。" → draw (获得)
      // 遗计: "当你受到1点伤害后，你可以摸两张牌，然后将至多两张手牌交给任意角色。" → draw (摸)
      const tiandu = makeSkill(
        'skill_tiandu',
        '当你的判定牌生效后，你可以获得此判定牌。',
      );
      const yiji = makeSkill(
        'skill_yiji',
        '当你受到1点伤害后，你可以摸两张牌，然后将至多两张手牌交给任意角色。',
      );
      const guojia = makeGeneral('general_guojia', ['skill_tiandu', 'skill_yiji'], {
        name: '郭嘉',
        hp: 3,
        maxHp: 3,
      });

      const evaluator = new GeneralEvaluator([guojia], [tiandu, yiji]);
      const scores = evaluator.evaluateGeneral('general_guojia' as GeneralId);

      expect(scores).not.toBeNull();
      // Both skills grant card acquisition → draw should be the highest dimension
      expect(scores!.draw).toBeGreaterThan(scores!.burst);
      expect(scores!.draw).toBeGreaterThanOrEqual(4);
    });

    it('returns null for unknown general', () => {
      const evaluator = new GeneralEvaluator([], []);
      const scores = evaluator.evaluateGeneral('nonexistent' as GeneralId);

      expect(scores).toBeNull();
    });
  });
});
