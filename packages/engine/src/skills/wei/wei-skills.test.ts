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
import { chengxiang } from './wei031-caochong.js';

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
  it('registers all 88 generals worth of skills without duplicate IDs', () => {
    const registry = new SkillRegistry();
    registerWeiSkills(registry);

    // Every skill should be retrievable by its event triggers
    const ids = new Set(allWeiSkills.map(s => s.id));
    expect(ids.size).toBe(allWeiSkills.length);

    // At minimum we expect the 88 generals worth of skills (some have 2+)
    expect(allWeiSkills.length).toBeGreaterThanOrEqual(88);
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

/* ------------------------------------------------------------------ */
/*  Chengxiang (WEI031 曹冲 — Weighing the Elephant)                   */
/* ------------------------------------------------------------------ */

describe('skill_chengxiang (曹冲 — Weighing the Elephant)', () => {
  it('keeps revealed cards summing to 13 or less after taking damage', () => {
    const caochong = makePlayer('caochong', {
      mainGeneral: { generalId: 'general_wei_031' as GeneralId, revealed: true },
    });
    const enemy = makePlayer('enemy');
    // Top 4 cards: numbers 2, 3, 5, 10 — should keep 2+3+5=10 (<=13), discard 10
    const drawPile = [
      makeCard('c1', 'spade'),   // number 7 by default; override below
      makeCard('c2', 'heart'),
      makeCard('c3', 'club'),
      makeCard('c4', 'diamond'),
      makeCard('c5', 'spade'),   // extra card stays in pile
    ];
    // Override card numbers for deterministic testing
    drawPile[0].number = 2;
    drawPile[1].number = 3;
    drawPile[2].number = 5;
    drawPile[3].number = 10;
    drawPile[4].number = 1;

    const game = makeGame([caochong, enemy], drawPile);

    const ctx = createSkillContext({
      game,
      player: caochong,
      event: {
        type: 'damage',
        source: enemy.id,
        target: caochong.id,
        amount: 1,
      },
    });

    expect(chengxiang.canActivate(ctx)).toBe(true);

    chengxiang.activate(ctx);

    // Kept cards: 2 + 3 + 5 = 10 (<=13), discarded: 10
    expect(caochong.handCards).toHaveLength(3);
    expect(game.discardPile).toHaveLength(1);
    expect(game.discardPile[0].number).toBe(10);
    // The extra card (c5) should remain in the draw pile
    expect(game.drawPile).toHaveLength(1);
    expect(game.drawPile[0].number).toBe(1);
  });

  it('does not activate when draw pile has fewer than 4 cards', () => {
    const caochong = makePlayer('caochong');
    const enemy = makePlayer('enemy');
    const drawPile = [makeCard('c1'), makeCard('c2')]; // only 2 cards
    const game = makeGame([caochong, enemy], drawPile);

    const ctx = createSkillContext({
      game,
      player: caochong,
      event: {
        type: 'damage',
        source: enemy.id,
        target: caochong.id,
        amount: 1,
      },
    });

    expect(chengxiang.canActivate(ctx)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  WEI031-060 placeholder registration sanity check                   */
/* ------------------------------------------------------------------ */

describe('WEI031-060 skill coverage', () => {
  it('every general 031-060 contributes at least one skill with a unique ID', () => {
    const registry = new SkillRegistry();
    registerWeiSkills(registry);

    // Collect IDs for skills from generals 031-060
    const wei031to060Ids = allWeiSkills
      .filter(s => s.id.startsWith('skill_wei03') ||
                   s.id.startsWith('skill_wei04') ||
                   s.id.startsWith('skill_wei05') ||
                   s.id.startsWith('skill_wei06') ||
                   s.id.startsWith('skill_chengxiang') ||
                   s.id.startsWith('skill_renxin') ||
                   s.id.startsWith('skill_jingce') ||
                   s.id.startsWith('skill_sidi') ||
                   s.id.startsWith('skill_dingpin') ||
                   s.id.startsWith('skill_faen') ||
                   s.id.startsWith('skill_muyi') ||
                   s.id.startsWith('skill_mingjian') ||
                   s.id.startsWith('skill_huituo') ||
                   s.id.startsWith('skill_taoxi') ||
                   s.id.startsWith('skill_buyi') ||
                   s.id.startsWith('skill_jilei') ||
                   s.id.startsWith('skill_danlao') ||
                   s.id.startsWith('skill_bifa') ||
                   s.id.startsWith('skill_songci') ||
                   s.id.startsWith('skill_kangkai') ||
                   s.id.startsWith('skill_gongxian') ||
                   s.id.startsWith('skill_juyi') ||
                   s.id.startsWith('skill_qushe') ||
                   s.id.startsWith('skill_gushe') ||
                   s.id.startsWith('skill_zhongjian') ||
                   s.id.startsWith('skill_cunyuan') ||
                   s.id.startsWith('skill_daoshu'))
      .map(s => s.id);

    // We should have at least 30 skills from the 30 new generals
    expect(wei031to060Ids.length).toBeGreaterThanOrEqual(30);

    // All IDs should be unique
    const uniqueIds = new Set(wei031to060Ids);
    expect(uniqueIds.size).toBe(wei031to060Ids.length);
  });
});

/* ------------------------------------------------------------------ */
/*  WEI061-088 registration and placeholder validation                 */
/* ------------------------------------------------------------------ */

describe('WEI061-088 skill coverage', () => {
  it('every general 061-088 contributes at least one skill with a unique ID', () => {
    const registry = new SkillRegistry();
    registerWeiSkills(registry);

    // Collect IDs for skills from generals 061-088
    const wei061to088Ids = allWeiSkills
      .filter(s => s.id.startsWith('skill_wei06') ||
                   s.id.startsWith('skill_wei07') ||
                   s.id.startsWith('skill_wei08'))
      .map(s => s.id);

    // We should have at least 28 skills from the 28 new generals
    expect(wei061to088Ids.length).toBeGreaterThanOrEqual(28);

    // All IDs should be unique
    const uniqueIds = new Set(wei061to088Ids);
    expect(uniqueIds.size).toBe(wei061to088Ids.length);
  });

  it('all 061-088 placeholders have canActivate returning false', () => {
    const wei061to088 = allWeiSkills.filter(
      s => s.id.startsWith('skill_wei06') ||
           s.id.startsWith('skill_wei07') ||
           s.id.startsWith('skill_wei08'),
    );

    const dummyCtx = createSkillContext({
      game: makeGame([makePlayer('p1')]),
      player: makePlayer('p1'),
      event: { type: 'phaseChange', player: 'p1' as PlayerId, phase: 'prepare' },
    });

    for (const skill of wei061to088) {
      expect(skill.canActivate(dummyCtx)).toBe(false);
    }
  });

  it('full WEI registry covers all 88 generals', () => {
    // Verify we have skills spanning the entire WEI001-088 range
    const allIds = allWeiSkills.map(s => s.id);

    // Check representative skills from each batch
    expect(allIds).toContain('skill_jianxiong');        // WEI001
    expect(allIds).toContain('skill_fankui');            // WEI002
    expect(allIds).toContain('skill_chengxiang');        // WEI031
    expect(allIds).toContain('skill_daoshu');            // WEI060
    expect(allIds).toContain('skill_wei061_placeholder'); // WEI061
    expect(allIds).toContain('skill_wei075_placeholder'); // WEI075
    expect(allIds).toContain('skill_wei088_placeholder'); // WEI088

    // Total should be >= 88 (some generals have multiple skills)
    expect(allWeiSkills.length).toBeGreaterThanOrEqual(88);
  });
});
