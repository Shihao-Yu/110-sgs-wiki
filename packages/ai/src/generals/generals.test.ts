import { describe, it, expect } from 'vitest';
import type { Card, CardId, GeneralId } from '@sgs/data';
import type { GameState, PlayerState, PlayerId } from '@sgs/engine';
import { AIPlayer } from './ai-player.js';
import { GENERAL_PROFILES, getProfile, DEFAULT_PROFILE } from './profiles.js';

// ---------------------------------------------------------------------------
// Test Helpers (mirrored from strategy.test.ts for consistency)
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
    id: `card_${name}_${Math.random().toString(36).slice(2, 6)}` as CardId,
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

// ---------------------------------------------------------------------------
// Profile Tests
// ---------------------------------------------------------------------------

describe('GeneralProfiles', () => {
  it('contains exactly 30 general profiles', () => {
    expect(GENERAL_PROFILES.size).toBe(30);
  });

  it('returns DEFAULT_PROFILE for unknown generals', () => {
    const profile = getProfile('unknown_general' as GeneralId);
    expect(profile.aggressiveness).toBe(DEFAULT_PROFILE.aggressiveness);
    expect(profile.targetStrategy).toBe(DEFAULT_PROFILE.targetStrategy);
    expect(profile.generalId).toBe('unknown_general');
  });

  it('all profiles have aggressiveness in 0-1 range', () => {
    for (const [, profile] of GENERAL_PROFILES) {
      expect(profile.aggressiveness).toBeGreaterThanOrEqual(0);
      expect(profile.aggressiveness).toBeLessThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// AIPlayer — ZhangFei: spam unlimited attacks
// ---------------------------------------------------------------------------

describe('AIPlayer — ZhangFei (咆哮: unlimited attacks)', () => {
  it('plays multiple 杀 in a single turn', () => {
    const ai = new AIPlayer('zhangfei');
    const me = makePlayer('zhangfei', {
      handCards: [makeCard('杀'), makeCard('杀'), makeCard('杀')],
    });
    const enemy = makePlayer('enemy', { hp: 3, maxHp: 4 });
    const game = makeGame([me, enemy]);

    const actions = ai.decideTurn(game, me);
    const slashActions = actions.filter(
      (a) => a.type === 'play' && a.card?.name === '杀',
    );

    // ZhangFei's aggressiveness is 1.0, so all 杀 should be played
    expect(slashActions.length).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// AIPlayer — ZhugeLiang: conserve hand, very conservative
// ---------------------------------------------------------------------------

describe('AIPlayer — ZhugeLiang (空城: conserve hand)', () => {
  it('does not waste 闪 on discard when it could be kept for defense', () => {
    const ai = new AIPlayer('zhugeliang');
    const me = makePlayer('zhugeliang', {
      hp: 2,
      maxHp: 3,
      handCards: [
        makeCard('闪'),
        makeCard('无懈可击', { type: 'trick' }),
        makeCard('杀'),
        makeCard('闪电', { type: 'trick' }),
      ],
    });
    const game = makeGame([me]);

    // Must discard 1 card — should discard the lowest-value card, not 闪 or 无懈可击
    const discard = ai.evaluateDiscard(game, me, 1);
    expect(discard.cards).toHaveLength(1);
    // ZhugeLiang protects 无懈可击, 闪, and 桃 — so the lowest should be 杀 or 闪电
    const discardedName = discard.cards[0]!.name;
    expect(['杀', '闪电']).toContain(discardedName);
  });
});

// ---------------------------------------------------------------------------
// AIPlayer — CaoCao: aggressive targeting, values damage cards
// ---------------------------------------------------------------------------

describe('AIPlayer — CaoCao (奸雄: acquire damage cards)', () => {
  it('scores 杀 and 决斗 higher than default', () => {
    const ai = new AIPlayer('caocao');
    const me = makePlayer('caocao', {
      handCards: [
        makeCard('杀'),
        makeCard('决斗', { type: 'trick' }),
        makeCard('闪电', { type: 'trick' }),
      ],
    });

    const scored = ai.scoreHand(me);
    const slashScore = scored.find((s) => s.card.name === '杀')!.score;
    const lightningScore = scored.find((s) => s.card.name === '闪电')!.score;

    // CaoCao's profile adds +2 to 杀 and +2 to 决斗, plus discardProtect +1 for 杀
    // 杀 should be much more valuable than 闪电
    expect(slashScore).toBeGreaterThan(lightningScore);
  });

  it('targets the weakest enemy (default target strategy)', () => {
    const ai = new AIPlayer('caocao');
    const me = makePlayer('caocao', {
      handCards: [makeCard('杀')],
    });
    const strong = makePlayer('strong', { hp: 4, maxHp: 4 });
    const weak = makePlayer('weak', { hp: 1, maxHp: 4 });
    const game = makeGame([me, strong, weak]);

    const result = ai.evaluateTarget(game, me, [strong.id, weak.id]);
    expect(result.targetId).toBe(weak.id);
  });
});

// ---------------------------------------------------------------------------
// AIPlayer — DaQiao: targets strongest (乐不思蜀 lockdown strategy)
// ---------------------------------------------------------------------------

describe('AIPlayer — DaQiao (国色: target strongest)', () => {
  it('targets the strongest enemy', () => {
    const ai = new AIPlayer('daqiao');
    const me = makePlayer('daqiao');
    const strong = makePlayer('strong', {
      hp: 4,
      maxHp: 4,
      handCards: [makeCard('杀'), makeCard('杀'), makeCard('杀')],
    });
    const weak = makePlayer('weak', { hp: 1, maxHp: 4 });
    const game = makeGame([me, strong, weak]);

    const result = ai.evaluateTarget(game, me, [strong.id, weak.id]);
    expect(result.targetId).toBe(strong.id);
  });
});

// ---------------------------------------------------------------------------
// AIPlayer — Response thresholds
// ---------------------------------------------------------------------------

describe('AIPlayer — Response thresholds vary by general', () => {
  it('XiahouDun (dodgeThreshold 0.4) does NOT dodge at full HP', () => {
    const ai = new AIPlayer('xiahoudun');
    const me = makePlayer('xiahoudun', {
      hp: 4,
      maxHp: 4,
      handCards: [makeCard('闪')],
    });
    const game = makeGame([me]);

    // HP ratio = 1.0 > dodgeThreshold 0.4 → should NOT dodge
    const response = ai.evaluateResponse(game, me, '闪');
    expect(response.respond).toBe(false);
  });

  it('XiahouDun dodges when HP is low (ratio <= 0.4)', () => {
    const ai = new AIPlayer('xiahoudun');
    const me = makePlayer('xiahoudun', {
      hp: 1,
      maxHp: 4,
      handCards: [makeCard('闪')],
    });
    const game = makeGame([me]);

    // HP ratio = 0.25 <= 0.4 → should dodge
    const response = ai.evaluateResponse(game, me, '闪');
    expect(response.respond).toBe(true);
  });

  it('LiuBei (peachThreshold 0.7) uses 桃 at moderate HP', () => {
    const ai = new AIPlayer('liubei');
    const me = makePlayer('liubei', {
      hp: 2,
      maxHp: 4,
      handCards: [makeCard('桃')],
    });
    const game = makeGame([me]);

    // HP ratio = 0.5 <= 0.7 → should use 桃
    const response = ai.evaluateResponse(game, me, '桃');
    expect(response.respond).toBe(true);
  });

  it('CaoCao (peachThreshold 0.4) conserves 桃 at moderate HP', () => {
    const ai = new AIPlayer('caocao');
    const me = makePlayer('caocao', {
      hp: 2,
      maxHp: 4,
      handCards: [makeCard('桃')],
    });
    const game = makeGame([me]);

    // HP ratio = 0.5 > 0.4 → should NOT use 桃
    const response = ai.evaluateResponse(game, me, '桃');
    expect(response.respond).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AIPlayer — Target strategy: mostCards (SimaYi / ZhangLiao)
// ---------------------------------------------------------------------------

describe('AIPlayer — SimaYi (反馈: target mostCards)', () => {
  it('targets the player with most hand cards', () => {
    const ai = new AIPlayer('simayi');
    const me = makePlayer('simayi');
    const fewCards = makePlayer('few', {
      hp: 4,
      handCards: [makeCard('杀')],
    });
    const manyCards = makePlayer('many', {
      hp: 2,
      handCards: [makeCard('杀'), makeCard('闪'), makeCard('桃'), makeCard('决斗', { type: 'trick' })],
    });
    const game = makeGame([me, fewCards, manyCards]);

    const result = ai.evaluateTarget(game, me, [fewCards.id, manyCards.id]);
    expect(result.targetId).toBe(manyCards.id);
  });
});
