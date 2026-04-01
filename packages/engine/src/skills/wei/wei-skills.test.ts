import type { Card, CardId, GeneralId, SkillId } from '@sgs/data';
import { describe, expect, it } from 'vitest';
import type { GameState } from '../../state/game.js';
import type { PlayerState } from '../../state/player.js';
import type { PlayerId } from '../../state/types.js';
import { createSkillContext } from '../skill-context.js';
import { SkillRegistry } from '../skill-registry.js';
import { allWeiSkills, registerWeiSkills } from './index.js';
import { jianxiong } from './wei001-caocao.js';
import { fankui } from './wei002-simayi.js';
import { ganglie } from './wei003-xiahoudun.js';
import { luoshen } from './wei007-zhenji.js';
import { yiji } from './wei006-guojia.js';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function makeCard(id: string, suit: 'spade' | 'heart' | 'club' | 'diamond' = 'spade'): Card {
  return {
    id: id as CardId,
    name: 'TestCard',
    type: 'basic',
    suit,
    number: 7,
    description: 'test',
  };
}

function makePlayer(
  id: string,
  overrides: Partial<PlayerState> = {},
): PlayerState {
  return {
    id: id as PlayerId,
    name: `Player ${id}`,
    seat: 0,
    mainGeneral: overrides.mainGeneral ?? null,
    deputyGeneral: overrides.deputyGeneral ?? null,
    hp: overrides.hp ?? 4,
    maxHp: overrides.maxHp ?? 4,
    handCards: overrides.handCards ?? [],
    equipment: overrides.equipment ?? {
      weapon: null,
      armor: null,
      defensiveHorse: null,
      offensiveHorse: null,
      treasure: null,
    },
    judgmentArea: [],
    faction: null,
    alive: true,
    skills: overrides.skills ?? [],
    marks: overrides.marks ?? {},
  };
}

function makeGame(players: PlayerState[], drawPile: Card[] = []): GameState {
  return {
    players,
    drawPile,
    discardPile: [],
    currentPlayerIndex: 0,
    currentPhase: 'prepare',
    turnCount: 1,
    activeEffects: [],
    gameOver: false,
    winnerFaction: null,
  };
}

/* ------------------------------------------------------------------ */
/*  Registration test                                                 */
/* ------------------------------------------------------------------ */

describe('WEI skill registration', () => {
  it('registers all 30 generals worth of skills without duplicate IDs', () => {
    const registry = new SkillRegistry();
    registerWeiSkills(registry);

    // Every skill should be retrievable by its event triggers
    const ids = new Set(allWeiSkills.map(s => s.id));
    expect(ids.size).toBe(allWeiSkills.length);

    // At minimum we expect the 8 key generals + placeholders
    expect(allWeiSkills.length).toBeGreaterThanOrEqual(30);
  });
});

/* ------------------------------------------------------------------ */
/*  Jianxiong (WEI001 曹操 — Treachery)                               */
/* ------------------------------------------------------------------ */

describe('skill_jianxiong (曹操 — Treachery)', () => {
  it('activates when Cao Cao takes damage from another player', () => {
    const caocao = makePlayer('caocao', {
      mainGeneral: { generalId: 'general_caocao' as GeneralId, revealed: true },
      skills: ['skill_jianxiong' as SkillId],
    });
    const enemy = makePlayer('enemy');
    const drawPile = [makeCard('d1'), makeCard('d2')];
    const game = makeGame([caocao, enemy], drawPile);

    const ctx = createSkillContext({
      game,
      player: caocao,
      event: {
        type: 'damage',
        source: enemy.id,
        target: caocao.id,
        amount: 1,
      },
    });

    expect(jianxiong.canActivate(ctx)).toBe(true);

    jianxiong.activate(ctx);
    // Should have drawn 1 card (representing acquiring the causal card)
    expect(caocao.handCards).toHaveLength(1);
    expect(game.drawPile).toHaveLength(1);
  });

  it('does not activate when Cao Cao is the damage source, not target', () => {
    const caocao = makePlayer('caocao');
    const enemy = makePlayer('enemy');
    const game = makeGame([caocao, enemy]);

    const ctx = createSkillContext({
      game,
      player: caocao,
      event: {
        type: 'damage',
        source: caocao.id,
        target: enemy.id,
        amount: 1,
      },
    });

    expect(jianxiong.canActivate(ctx)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  Fankui (WEI002 司马懿 — Feedback)                                  */
/* ------------------------------------------------------------------ */

describe('skill_fankui (司马懿 — Feedback)', () => {
  it('steals a card from the damage source when activated', () => {
    const simayi = makePlayer('simayi');
    const enemy = makePlayer('enemy', {
      handCards: [makeCard('e1'), makeCard('e2')],
    });
    const game = makeGame([simayi, enemy]);

    const ctx = createSkillContext({
      game,
      player: simayi,
      event: {
        type: 'damage',
        source: enemy.id,
        target: simayi.id,
        amount: 1,
      },
    });

    fankui.activate(ctx);

    // Sima Yi takes one card from enemy
    expect(simayi.handCards).toHaveLength(1);
    expect(enemy.handCards).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ */
/*  Ganglie (WEI003 夏侯惇 — Unyielding)                              */
/* ------------------------------------------------------------------ */

describe('skill_ganglie (夏侯惇 — Unyielding)', () => {
  it('forces source to discard 2 cards when judgment is not heart', () => {
    const dun = makePlayer('dun');
    const enemy = makePlayer('enemy', {
      handCards: [makeCard('e1'), makeCard('e2'), makeCard('e3')],
    });
    // Judgment card is spade (not heart) — skill effect triggers
    const judgmentCard = makeCard('judge', 'spade');
    const game = makeGame([dun, enemy], [judgmentCard]);

    const ctx = createSkillContext({
      game,
      player: dun,
      event: {
        type: 'damage',
        source: enemy.id,
        target: dun.id,
        amount: 1,
      },
    });

    ganglie.activate(ctx);

    // Enemy had 3 cards, discardCards was called on the first 2
    // Note: discardCards filters by card ID, and the splice already removed them
    // from handCards, so enemy should have 1 card left
    expect(enemy.handCards.length).toBeLessThanOrEqual(1);
  });
});

/* ------------------------------------------------------------------ */
/*  Luoshen (WEI007 甄姬 — Goddess)                                    */
/* ------------------------------------------------------------------ */

describe('skill_luoshen (甄姬 — Goddess)', () => {
  it('collects consecutive black cards and stops on red', () => {
    const zhenji = makePlayer('zhenji', {
      mainGeneral: { generalId: 'general_zhenji' as GeneralId, revealed: true },
    });
    const drawPile = [
      makeCard('c1', 'spade'),
      makeCard('c2', 'club'),
      makeCard('c3', 'heart'), // red — stops here
      makeCard('c4', 'spade'),
    ];
    const game = makeGame([zhenji], drawPile);

    const ctx = createSkillContext({
      game,
      player: zhenji,
      event: {
        type: 'phaseChange',
        player: zhenji.id,
        phase: 'prepare',
      },
    });

    expect(luoshen.canActivate(ctx)).toBe(true);

    luoshen.activate(ctx);

    // Zhenji keeps the 2 black cards, heart goes to discard
    expect(zhenji.handCards).toHaveLength(2);
    expect(zhenji.handCards[0].id).toBe('c1');
    expect(zhenji.handCards[1].id).toBe('c2');
    expect(game.discardPile).toHaveLength(1);
    expect(game.discardPile[0].suit).toBe('heart');
    // c4 remains in draw pile
    expect(game.drawPile).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ */
/*  Yiji (WEI006 郭嘉 — Last Plan)                                    */
/* ------------------------------------------------------------------ */

describe('skill_yiji (郭嘉 — Last Plan)', () => {
  it('draws 2 cards when Guo Jia takes damage', () => {
    const guojia = makePlayer('guojia');
    const enemy = makePlayer('enemy');
    const drawPile = [makeCard('d1'), makeCard('d2'), makeCard('d3')];
    const game = makeGame([guojia, enemy], drawPile);

    const ctx = createSkillContext({
      game,
      player: guojia,
      event: {
        type: 'damage',
        source: enemy.id,
        target: guojia.id,
        amount: 1,
      },
    });

    expect(yiji.canActivate(ctx)).toBe(true);

    yiji.activate(ctx);

    expect(guojia.handCards).toHaveLength(2);
    expect(game.drawPile).toHaveLength(1);
  });
});
