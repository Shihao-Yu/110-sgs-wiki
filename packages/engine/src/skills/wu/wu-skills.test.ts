import type { Card, CardId, GeneralId, SkillId } from '@sgs/data';
import { describe, expect, it } from 'vitest';
import type { GameState } from '../../state/game.js';
import type { PlayerState } from '../../state/player.js';
import type { PlayerId } from '../../state/types.js';
import { createSkillContext } from '../skill-context.js';
import { SkillRegistry } from '../skill-registry.js';
import { wuSkills } from './index.js';

// --- helpers ---------------------------------------------------------------

function makeCard(
  id: string,
  overrides: Partial<Card> = {},
): Card {
  return {
    id: id as CardId,
    name: overrides.name ?? 'Slash',
    type: overrides.type ?? 'basic',
    suit: overrides.suit ?? 'spade',
    number: overrides.number ?? 7,
    description: overrides.description ?? '',
    ...overrides,
  };
}

function makePlayer(
  id: string,
  options: {
    mainGeneralId?: string;
    skills?: string[];
    hp?: number;
    maxHp?: number;
    handCards?: Card[];
  } = {},
): PlayerState {
  return {
    id: id as PlayerId,
    name: `Player ${id}`,
    seat: 0,
    mainGeneral: options.mainGeneralId
      ? { generalId: options.mainGeneralId as GeneralId, revealed: true }
      : null,
    deputyGeneral: null,
    hp: options.hp ?? 4,
    maxHp: options.maxHp ?? 4,
    handCards: options.handCards ?? [],
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
    skills: (options.skills ?? []).map(s => s as SkillId),
    marks: {},
  };
}

function makeGame(players: PlayerState[], drawPileSize = 10): GameState {
  const drawPile = Array.from({ length: drawPileSize }, (_, i) =>
    makeCard(`draw-${i}`, { name: 'DrawCard', suit: 'heart' }),
  );
  return {
    players,
    drawPile,
    discardPile: [],
    currentPlayerIndex: 0,
    currentPhase: 'play',
    turnCount: 1,
    activeEffects: [],
    gameOver: false,
    winnerFaction: null,
  };
}

// --- registration ----------------------------------------------------------

describe('WU skill registration', () => {
  it('registers all WU skills without ID collisions', () => {
    const registry = new SkillRegistry();
    for (const skill of wuSkills) {
      registry.register(skill);
    }

    // Spot-check counts: 27 generals, but several have 2 skills
    expect(wuSkills.length).toBeGreaterThanOrEqual(27);

    // Every skill should be retrievable by its event triggers
    for (const skill of wuSkills) {
      for (const trigger of skill.triggers) {
        const found = registry.getSkillsForEvent(trigger);
        expect(found.map(s => s.id)).toContain(skill.id);
      }
    }
  });
});

// --- WU001 制衡 (Zhiheng) --------------------------------------------------

describe('WU001 zhiheng', () => {
  it('discards hand cards then draws the same number', () => {
    const hand = [
      makeCard('h1', { suit: 'spade' }),
      makeCard('h2', { suit: 'club' }),
      makeCard('h3', { suit: 'heart' }),
    ];
    const player = makePlayer('p1', {
      mainGeneralId: 'WU001',
      skills: ['zhiheng'],
      handCards: hand,
    });
    const game = makeGame([player]);
    const registry = new SkillRegistry();
    const skill = wuSkills.find(s => s.id === 'zhiheng')!;
    registry.register(skill);

    const ctx = createSkillContext({
      game,
      player,
      event: {
        type: 'playCard',
        player: player.id,
        card: makeCard('trigger'),
      },
    });

    expect(skill.canActivate(ctx)).toBe(true);
    skill.activate(ctx);

    // Original 3 cards discarded, 3 new cards drawn from draw pile
    expect(game.discardPile).toHaveLength(3);
    expect(player.handCards).toHaveLength(3);
    // The drawn cards should come from the draw pile
    expect(player.handCards[0]!.name).toBe('DrawCard');
  });
});

// --- WU004 苦肉 (Kurou) ---------------------------------------------------

describe('WU004 kurou', () => {
  it('loses 1 HP and draws 2 cards', () => {
    const player = makePlayer('p1', {
      mainGeneralId: 'WU004',
      skills: ['kurou'],
      hp: 4,
      maxHp: 4,
    });
    const game = makeGame([player]);
    const skill = wuSkills.find(s => s.id === 'kurou')!;

    const ctx = createSkillContext({
      game,
      player,
      event: {
        type: 'loseHp',
        player: player.id,
        amount: 1,
      },
    });

    expect(skill.canActivate(ctx)).toBe(true);
    skill.activate(ctx);

    expect(player.hp).toBe(3); // lost 1 HP
    expect(player.handCards).toHaveLength(2); // drew 2 cards
  });
});

// --- WU005 英姿 (Yingzi) --------------------------------------------------

describe('WU005 yingzi', () => {
  it('draws 1 extra card during draw event', () => {
    const player = makePlayer('p1', {
      mainGeneralId: 'WU005',
      skills: ['yingzi'],
    });
    const game = makeGame([player]);
    const skill = wuSkills.find(s => s.id === 'yingzi')!;

    const ctx = createSkillContext({
      game,
      player,
      event: {
        type: 'drawCards',
        player: player.id,
        count: 2,
      },
    });

    expect(skill.canActivate(ctx)).toBe(true);
    skill.activate(ctx);

    expect(player.handCards).toHaveLength(1); // 1 extra drawn
  });
});

// --- WU007 连营 (Lianying) -------------------------------------------------

describe('WU007 lianying', () => {
  it('draws 1 card when last hand card is lost', () => {
    const player = makePlayer('p1', {
      mainGeneralId: 'WU007',
      skills: ['lianying'],
      handCards: [], // already empty after discard
    });
    const discardedCard = makeCard('d1');
    const game = makeGame([player]);
    const skill = wuSkills.find(s => s.id === 'lianying')!;

    const ctx = createSkillContext({
      game,
      player,
      event: {
        type: 'discardCards',
        player: player.id,
        cards: [discardedCard],
      },
    });

    expect(skill.canActivate(ctx)).toBe(true);
    skill.activate(ctx);

    expect(player.handCards).toHaveLength(1);
  });
});

// --- WU008 枭姬 (Xiaoji) --------------------------------------------------

describe('WU008 xiaoji', () => {
  it('draws 2 cards per equipment card lost', () => {
    const equipCard = makeCard('eq1', { type: 'equipment', name: 'Axe' });
    const player = makePlayer('p1', {
      mainGeneralId: 'WU008',
      skills: ['xiaoji'],
    });
    const game = makeGame([player]);
    const skill = wuSkills.find(s => s.id === 'xiaoji')!;

    const ctx = createSkillContext({
      game,
      player,
      event: {
        type: 'discardCards',
        player: player.id,
        cards: [equipCard],
      },
    });

    expect(skill.canActivate(ctx)).toBe(true);
    skill.activate(ctx);

    expect(player.handCards).toHaveLength(2); // 2 cards drawn for 1 equipment
  });
});

// --- WU002 奇袭 (Qixi) ---------------------------------------------------

describe('WU002 qixi', () => {
  it('activates on black-suited cards and discards target card', () => {
    const target = makePlayer('p2', {
      handCards: [makeCard('t1')],
    });
    const player = makePlayer('p1', {
      mainGeneralId: 'WU002',
      skills: ['qixi'],
    });
    const game = makeGame([player, target]);
    const skill = wuSkills.find(s => s.id === 'qixi')!;

    const blackCard = makeCard('bc', { suit: 'club' });
    const ctx = createSkillContext({
      game,
      player,
      event: {
        type: 'playCard',
        player: player.id,
        card: blackCard,
        targets: [target.id],
      },
    });

    expect(skill.canActivate(ctx)).toBe(true);
    skill.activate(ctx);

    expect(target.handCards).toHaveLength(0);
    expect(game.discardPile).toHaveLength(1);
  });

  it('does not activate on red-suited cards', () => {
    const player = makePlayer('p1', {
      mainGeneralId: 'WU002',
      skills: ['qixi'],
    });
    const game = makeGame([player]);
    const skill = wuSkills.find(s => s.id === 'qixi')!;

    const redCard = makeCard('rc', { suit: 'heart' });
    const ctx = createSkillContext({
      game,
      player,
      event: {
        type: 'playCard',
        player: player.id,
        card: redCard,
      },
    });

    expect(skill.canActivate(ctx)).toBe(false);
  });
});
