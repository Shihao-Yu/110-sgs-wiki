import type { Card, CardId, GeneralId, SkillId } from '@sgs/data';
import { describe, expect, it } from 'vitest';
import type { GameState } from '../../state/game.js';
import type { PlayerState } from '../../state/player.js';
import type { PlayerId } from '../../state/types.js';
import { createSkillContext } from '../skill-context.js';
import { SkillRegistry } from '../skill-registry.js';
import { shuSkills, allShuSkills } from './index.js';
import { rende } from './shu001-rende.js';
import { paoxiao } from './shu003-paoxiao.js';
import { guanxing } from './shu004-guanxing.js';
import { kongcheng } from './shu004-kongcheng.js';
import { longdan } from './shu005-longdan.js';
import { tieqi } from './shu006-tieqi.js';
import { liegong } from './shu007-liegong.js';
import { kuanggu } from './shu008-kuanggu.js';
import { jizhi, qicai } from './shu009-huangyueying.js';
import { lianhuan, niepan } from './shu010-pangtong.js';
import { tiaoxin } from './shu011-jiangwei.js';
import { enyuanGratitude, enyuanGrudge } from './shu012-fazheng.js';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function makeCard(
  id: string,
  name = '杀',
  suit: Card['suit'] = 'spade',
  number = 7,
): Card {
  return {
    id: id as CardId,
    name,
    type: 'basic',
    suit,
    number,
    description: `${name} card`,
  };
}

function makePlayer(
  id: string,
  options: {
    seat?: number;
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
    seat: options.seat ?? 0,
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
    skills: (options.skills ?? []).map((s) => s as SkillId),
    marks: {},
  };
}

function makeGame(
  players: PlayerState[],
  drawPile: Card[] = [],
): GameState {
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

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe('SHU skills — bulk registration', () => {
  it('registers all 10 SHU skills without collision', () => {
    const registry = new SkillRegistry();
    for (const skill of shuSkills) {
      registry.register(skill);
    }
    expect(shuSkills).toHaveLength(10);

    // Verify per-general queries
    expect(registry.getSkillsForGeneral('SHU001' as GeneralId)).toHaveLength(1);
    expect(registry.getSkillsForGeneral('SHU004' as GeneralId)).toHaveLength(2);
    expect(registry.getSkillsForGeneral('SHU006' as GeneralId)).toHaveLength(2);
  });
});

describe('SHU001 rende (Benevolence)', () => {
  it('transfers hand cards and recovers 1 HP when giving ≥2', () => {
    const cards = [makeCard('c1'), makeCard('c2'), makeCard('c3')];
    const liuBei = makePlayer('p1', {
      mainGeneralId: 'SHU001',
      skills: ['rende'],
      hp: 2,
      maxHp: 4,
      handCards: cards,
    });
    const ally = makePlayer('p2', { seat: 1 });
    const game = makeGame([liuBei, ally]);

    const ctx = createSkillContext({
      game,
      player: liuBei,
      event: { type: 'phaseChange', player: liuBei.id, phase: 'play' },
    });

    expect(rende.canActivate(ctx)).toBe(true);
    rende.activate(ctx);

    // Cards transferred
    expect(liuBei.handCards).toHaveLength(0);
    expect(ally.handCards).toHaveLength(3);

    // HP recovered (gave 3 >= 2)
    expect(liuBei.hp).toBe(3);
  });

  it('does not recover HP when giving only 1 card', () => {
    const liuBei = makePlayer('p1', {
      mainGeneralId: 'SHU001',
      skills: ['rende'],
      hp: 2,
      maxHp: 4,
      handCards: [makeCard('c1')],
    });
    const ally = makePlayer('p2', { seat: 1 });
    const game = makeGame([liuBei, ally]);

    const ctx = createSkillContext({
      game,
      player: liuBei,
      event: { type: 'phaseChange', player: liuBei.id, phase: 'play' },
    });

    rende.activate(ctx);

    expect(ally.handCards).toHaveLength(1);
    expect(liuBei.hp).toBe(2); // unchanged
  });
});

describe('SHU003 paoxiao (Roar)', () => {
  it('pushes an unlimitedSlash effect at play phase start', () => {
    const zhangFei = makePlayer('p1', {
      mainGeneralId: 'SHU003',
      skills: ['paoxiao'],
    });
    const game = makeGame([zhangFei]);

    const ctx = createSkillContext({
      game,
      player: zhangFei,
      event: { type: 'phaseChange', player: zhangFei.id, phase: 'play' },
    });

    expect(paoxiao.canActivate(ctx)).toBe(true);
    paoxiao.activate(ctx);

    const effect = game.activeEffects.find((e) => e.name === 'paoxiao');
    expect(effect).toBeDefined();
    expect(effect!.properties['unlimitedSlash']).toBe(true);
  });

  it('does not activate outside play phase', () => {
    const zhangFei = makePlayer('p1', {
      mainGeneralId: 'SHU003',
      skills: ['paoxiao'],
    });
    const game = makeGame([zhangFei]);

    const ctx = createSkillContext({
      game,
      player: zhangFei,
      event: { type: 'phaseChange', player: zhangFei.id, phase: 'draw' },
    });

    expect(paoxiao.canActivate(ctx)).toBe(false);
  });
});

describe('SHU004 guanxing (Stargaze)', () => {
  it('rearranges top cards of draw pile at draw phase', () => {
    const zgl = makePlayer('p1', {
      mainGeneralId: 'SHU004',
      skills: ['guanxing'],
    });
    const p2 = makePlayer('p2', { seat: 1 });
    const pile = [
      makeCard('d1'),
      makeCard('d2'),
      makeCard('d3'),
      makeCard('d4'),
    ];
    const game = makeGame([zgl, p2], pile);

    const ctx = createSkillContext({
      game,
      player: zgl,
      event: { type: 'phaseChange', player: zgl.id, phase: 'draw' },
    });

    expect(guanxing.canActivate(ctx)).toBe(true);
    guanxing.activate(ctx);

    // With 2 alive players, looks at min(5, 2, 4) = 2 cards
    // Keeps ceil(2/2) = 1 on top, sends 1 to bottom
    // Draw pile should still have 4 cards total
    expect(game.drawPile).toHaveLength(4);
  });
});

describe('SHU004 kongcheng (Empty Fort)', () => {
  it('activates immunity when hand is empty', () => {
    const zgl = makePlayer('p1', {
      mainGeneralId: 'SHU004',
      skills: ['kongcheng'],
      handCards: [],
    });
    const game = makeGame([zgl]);

    const ctx = createSkillContext({
      game,
      player: zgl,
      event: {
        type: 'discardCards',
        player: zgl.id,
        cards: [],
      },
    });

    expect(kongcheng.canActivate(ctx)).toBe(true);
    kongcheng.activate(ctx);

    const effect = game.activeEffects.find((e) => e.name === 'kongcheng');
    expect(effect).toBeDefined();
    expect(effect!.properties['immuneTo']).toBe('杀,决斗');
  });

  it('does not activate when hand has cards', () => {
    const zgl = makePlayer('p1', {
      mainGeneralId: 'SHU004',
      skills: ['kongcheng'],
      handCards: [makeCard('c1')],
    });
    const game = makeGame([zgl]);

    const ctx = createSkillContext({
      game,
      player: zgl,
      event: {
        type: 'discardCards',
        player: zgl.id,
        cards: [],
      },
    });

    expect(kongcheng.canActivate(ctx)).toBe(false);
  });
});

describe('SHU005 longdan (Dragon Heart)', () => {
  it('can activate when player has 杀 or 闪 in hand', () => {
    const zhaoYun = makePlayer('p1', {
      mainGeneralId: 'SHU005',
      skills: ['longdan'],
      handCards: [makeCard('c1', '杀'), makeCard('c2', '闪')],
    });
    const game = makeGame([zhaoYun]);

    const ctx = createSkillContext({
      game,
      player: zhaoYun,
      event: {
        type: 'playCard',
        player: zhaoYun.id,
        card: makeCard('c1', '杀'),
      },
    });

    expect(longdan.canActivate(ctx)).toBe(true);
    longdan.activate(ctx);

    const effect = game.activeEffects.find((e) => e.name === 'longdan');
    expect(effect).toBeDefined();
    expect(effect!.properties['slashAsDodge']).toBe(true);
    expect(effect!.properties['dodgeAsSlash']).toBe(true);
  });
});

describe('SHU006 tieqi (Iron Cavalry)', () => {
  it('prevents dodge when judgment card is red', () => {
    const maChao = makePlayer('p1', {
      mainGeneralId: 'SHU006',
      skills: ['tieqi'],
    });
    const target = makePlayer('p2', { seat: 1 });
    const slashCard = makeCard('s1', '杀');
    const redJudge = makeCard('j1', '桃', 'heart');
    const game = makeGame([maChao, target], [redJudge]);

    const ctx = createSkillContext({
      game,
      player: maChao,
      event: {
        type: 'playCard',
        player: maChao.id,
        card: slashCard,
        targets: [target.id],
      },
    });

    expect(tieqi.canActivate(ctx)).toBe(true);
    tieqi.activate(ctx);

    // Red judgment -> cannotDodge effect
    const effect = game.activeEffects.find((e) => e.name === 'tieqi');
    expect(effect).toBeDefined();
    expect(effect!.properties['cannotDodge']).toBe(true);
    expect(effect!.targetPlayerIds).toContain(target.id);

    // Judge card went to discard
    expect(game.discardPile).toHaveLength(1);
    expect(game.drawPile).toHaveLength(0);
  });

  it('does not prevent dodge when judgment card is black', () => {
    const maChao = makePlayer('p1', {
      mainGeneralId: 'SHU006',
      skills: ['tieqi'],
    });
    const target = makePlayer('p2', { seat: 1 });
    const slashCard = makeCard('s1', '杀');
    const blackJudge = makeCard('j1', '桃', 'spade');
    const game = makeGame([maChao, target], [blackJudge]);

    const ctx = createSkillContext({
      game,
      player: maChao,
      event: {
        type: 'playCard',
        player: maChao.id,
        card: slashCard,
        targets: [target.id],
      },
    });

    tieqi.activate(ctx);

    // Black judgment -> no cannotDodge effect
    const effect = game.activeEffects.find((e) => e.name === 'tieqi');
    expect(effect).toBeUndefined();
  });
});

describe('SHU007 liegong (Fierce Bow)', () => {
  it('prevents dodge when target hand count >= attacker HP', () => {
    const huangZhong = makePlayer('p1', {
      mainGeneralId: 'SHU007',
      skills: ['liegong'],
      hp: 3,
    });
    const target = makePlayer('p2', {
      seat: 1,
      handCards: [makeCard('c1'), makeCard('c2'), makeCard('c3')],
    });
    const slashCard = makeCard('s1', '杀');
    const game = makeGame([huangZhong, target]);

    const ctx = createSkillContext({
      game,
      player: huangZhong,
      event: {
        type: 'playCard',
        player: huangZhong.id,
        card: slashCard,
        targets: [target.id],
      },
    });

    expect(liegong.canActivate(ctx)).toBe(true);
    liegong.activate(ctx);

    // target hand count (3) >= attacker HP (3) -> cannotDodge
    const effect = game.activeEffects.find((e) => e.name === 'liegong');
    expect(effect).toBeDefined();
    expect(effect!.properties['cannotDodge']).toBe(true);
  });

  it('prevents dodge when target hand count <= attack range', () => {
    const huangZhong = makePlayer('p1', {
      mainGeneralId: 'SHU007',
      skills: ['liegong'],
      hp: 5,
    });
    const target = makePlayer('p2', {
      seat: 1,
      handCards: [makeCard('c1')],
    });
    const slashCard = makeCard('s1', '杀');
    const game = makeGame([huangZhong, target]);

    const ctx = createSkillContext({
      game,
      player: huangZhong,
      event: {
        type: 'playCard',
        player: huangZhong.id,
        card: slashCard,
        targets: [target.id],
      },
    });

    liegong.activate(ctx);

    // target hand count (1) <= attack range (1, no weapon) -> cannotDodge
    const effect = game.activeEffects.find((e) => e.name === 'liegong');
    expect(effect).toBeDefined();
  });

  it('does not prevent dodge when hand count is between attack range and HP', () => {
    const huangZhong = makePlayer('p1', {
      mainGeneralId: 'SHU007',
      skills: ['liegong'],
      hp: 5,
    });
    // Equip a weapon with range 1 (default)
    // target hand count = 3, attacker HP = 5, attack range = 1
    // 3 < 5 (not >= HP) and 3 > 1 (not <= range) -> no trigger
    const target = makePlayer('p2', {
      seat: 1,
      handCards: [makeCard('c1'), makeCard('c2'), makeCard('c3')],
    });
    const slashCard = makeCard('s1', '杀');
    const game = makeGame([huangZhong, target]);

    const ctx = createSkillContext({
      game,
      player: huangZhong,
      event: {
        type: 'playCard',
        player: huangZhong.id,
        card: slashCard,
        targets: [target.id],
      },
    });

    liegong.activate(ctx);

    const effect = game.activeEffects.find((e) => e.name === 'liegong');
    expect(effect).toBeUndefined();
  });
});

describe('SHU008 kuanggu (Crazy Bone)', () => {
  it('recovers HP when dealing damage to a player within distance 1', () => {
    const weiYan = makePlayer('p1', {
      seat: 0,
      mainGeneralId: 'SHU008',
      skills: ['kuanggu'],
      hp: 2,
      maxHp: 4,
    });
    const target = makePlayer('p2', { seat: 1 });
    const game = makeGame([weiYan, target]);

    const ctx = createSkillContext({
      game,
      player: weiYan,
      event: {
        type: 'damage',
        source: weiYan.id,
        target: target.id,
        amount: 1,
      },
    });

    // 2 players -> distance is always 1
    expect(kuanggu.canActivate(ctx)).toBe(true);
    kuanggu.activate(ctx);

    expect(weiYan.hp).toBe(3);
  });

  it('does not activate when at max HP', () => {
    const weiYan = makePlayer('p1', {
      seat: 0,
      mainGeneralId: 'SHU008',
      skills: ['kuanggu'],
      hp: 4,
      maxHp: 4,
    });
    const target = makePlayer('p2', { seat: 1 });
    const game = makeGame([weiYan, target]);

    const ctx = createSkillContext({
      game,
      player: weiYan,
      event: {
        type: 'damage',
        source: weiYan.id,
        target: target.id,
        amount: 1,
      },
    });

    expect(kuanggu.canActivate(ctx)).toBe(false);
  });

  it('does not activate when damage source is not the player', () => {
    const weiYan = makePlayer('p1', {
      seat: 0,
      mainGeneralId: 'SHU008',
      skills: ['kuanggu'],
      hp: 2,
      maxHp: 4,
    });
    const other = makePlayer('p2', { seat: 1 });
    const target = makePlayer('p3', { seat: 2 });
    const game = makeGame([weiYan, other, target]);

    const ctx = createSkillContext({
      game,
      player: weiYan,
      event: {
        type: 'damage',
        source: other.id,
        target: target.id,
        amount: 1,
      },
    });

    expect(kuanggu.canActivate(ctx)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  SHU009–SHU060 Tests                                                */
/* ------------------------------------------------------------------ */

describe('SHU skills — full roster registration (SHU001–SHU093)', () => {
  it('registers all SHU skills without id collision', () => {
    const registry = new SkillRegistry();
    for (const skill of allShuSkills) {
      registry.register(skill);
    }
    // 10 original + generals SHU009-SHU093 each contributing 1-2 skills
    expect(allShuSkills.length).toBeGreaterThanOrEqual(93);

    // Verify no duplicate IDs
    const ids = allShuSkills.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('legacy shuSkills array still has exactly 10 entries', () => {
    expect(shuSkills).toHaveLength(10);
  });

  it('covers all SHU generals from SHU061 through SHU093', () => {
    const generalIds = new Set(allShuSkills.map((s) => s.generalId));
    for (let i = 61; i <= 93; i++) {
      const id = `SHU${String(i).padStart(3, '0')}`;
      expect(generalIds.has(id as GeneralId)).toBe(true);
    }
  });

  it('every skill in allShuSkills has required fields', () => {
    for (const skill of allShuSkills) {
      expect(skill.id).toBeTruthy();
      expect(skill.name).toBeTruthy();
      expect(skill.generalId).toBeTruthy();
      expect(skill.type).toBeTruthy();
      expect(skill.triggers.length).toBeGreaterThan(0);
      expect(typeof skill.canActivate).toBe('function');
      expect(typeof skill.activate).toBe('function');
    }
  });
});

describe('SHU009 jizhi (Wisdom)', () => {
  it('draws 1 card when playing a non-delayed trick', () => {
    const hyy = makePlayer('p1', {
      mainGeneralId: 'SHU009',
      skills: ['jizhi'],
      handCards: [],
    });
    const trickCard = makeCard('t1', '过河拆桥', 'spade');
    // Override the type to trick
    (trickCard as Record<string, unknown>).type = 'trick';
    const drawPile = [makeCard('d1'), makeCard('d2')];
    const game = makeGame([hyy], drawPile);

    const ctx = createSkillContext({
      game,
      player: hyy,
      event: {
        type: 'playCard',
        player: hyy.id,
        card: trickCard,
      },
    });

    expect(jizhi.canActivate(ctx)).toBe(true);
    jizhi.activate(ctx);

    // Drew 1 card from draw pile
    expect(hyy.handCards).toHaveLength(1);
    expect(game.drawPile).toHaveLength(1);
  });

  it('does not trigger for delayed tricks', () => {
    const hyy = makePlayer('p1', {
      mainGeneralId: 'SHU009',
      skills: ['jizhi'],
    });
    const delayedTrick = makeCard('t1', '乐不思蜀', 'heart');
    (delayedTrick as Record<string, unknown>).type = 'trick';
    const game = makeGame([hyy]);

    const ctx = createSkillContext({
      game,
      player: hyy,
      event: {
        type: 'playCard',
        player: hyy.id,
        card: delayedTrick,
      },
    });

    expect(jizhi.canActivate(ctx)).toBe(false);
  });
});

describe('SHU010 niepan (Nirvana)', () => {
  it('recovers to 3 HP and draws 3 cards when dying (limited)', () => {
    const pt = makePlayer('p1', {
      mainGeneralId: 'SHU010',
      skills: ['niepan'],
      hp: 0,
      maxHp: 4,
      handCards: [makeCard('c1'), makeCard('c2')],
    });
    pt.mainGeneral = { generalId: 'SHU010' as GeneralId, revealed: true };
    const drawPile = [makeCard('d1'), makeCard('d2'), makeCard('d3'), makeCard('d4')];
    const game = makeGame([pt], drawPile);

    const ctx = createSkillContext({
      game,
      player: pt,
      event: { type: 'loseHp', player: pt.id, amount: 1 },
    });

    expect(niepan.canActivate(ctx)).toBe(true);
    niepan.activate(ctx);

    // HP recovered to 3
    expect(pt.hp).toBe(3);
    // Old hand cards discarded, 3 new cards drawn
    expect(pt.handCards).toHaveLength(3);
    // Limited — marked as used
    expect(pt.marks['niepan_used']).toBe(1);
    // General card flipped
    expect(pt.mainGeneral!.revealed).toBe(false);
  });

  it('cannot activate twice (limited skill)', () => {
    const pt = makePlayer('p1', {
      mainGeneralId: 'SHU010',
      skills: ['niepan'],
      hp: 0,
      maxHp: 4,
    });
    pt.marks['niepan_used'] = 1;
    const game = makeGame([pt]);

    const ctx = createSkillContext({
      game,
      player: pt,
      event: { type: 'loseHp', player: pt.id, amount: 1 },
    });

    expect(niepan.canActivate(ctx)).toBe(false);
  });
});

describe('SHU011 tiaoxin (Provoke)', () => {
  it('deals 1 damage when target has no 杀', () => {
    const jw = makePlayer('p1', {
      seat: 0,
      mainGeneralId: 'SHU011',
      skills: ['tiaoxin'],
      hp: 4,
      maxHp: 4,
    });
    const target = makePlayer('p2', {
      seat: 1,
      hp: 4,
      maxHp: 4,
      handCards: [makeCard('c1', '闪')], // no 杀
    });
    const game = makeGame([jw, target]);

    const ctx = createSkillContext({
      game,
      player: jw,
      event: { type: 'phaseChange', player: jw.id, phase: 'play' },
    });

    expect(tiaoxin.canActivate(ctx)).toBe(true);
    tiaoxin.activate(ctx);

    // Target took 1 damage (hp 4 -> 3)
    expect(target.hp).toBe(3);
  });

  it('pushes mustSlash effect when target has 杀', () => {
    const jw = makePlayer('p1', {
      seat: 0,
      mainGeneralId: 'SHU011',
      skills: ['tiaoxin'],
    });
    const target = makePlayer('p2', {
      seat: 1,
      handCards: [makeCard('c1', '杀')],
    });
    const game = makeGame([jw, target]);

    const ctx = createSkillContext({
      game,
      player: jw,
      event: { type: 'phaseChange', player: jw.id, phase: 'play' },
    });

    tiaoxin.activate(ctx);

    const effect = game.activeEffects.find((e) => e.name === 'tiaoxin');
    expect(effect).toBeDefined();
    expect(effect!.properties['mustSlash']).toBe(jw.id);
  });
});

describe('SHU012 enyuan (Gratitude & Grudge)', () => {
  it('grudge: takes hand card from damage source', () => {
    const fz = makePlayer('p1', {
      seat: 0,
      mainGeneralId: 'SHU012',
      skills: ['enyuan_grudge'],
      hp: 3,
      maxHp: 4,
      handCards: [],
    });
    const attacker = makePlayer('p2', {
      seat: 1,
      handCards: [makeCard('c1'), makeCard('c2')],
    });
    const game = makeGame([fz, attacker]);

    const ctx = createSkillContext({
      game,
      player: fz,
      event: {
        type: 'damage',
        source: attacker.id,
        target: fz.id,
        amount: 1,
      },
    });

    expect(enyuanGrudge.canActivate(ctx)).toBe(true);
    enyuanGrudge.activate(ctx);

    // Fa Zheng got 1 card from attacker
    expect(fz.handCards).toHaveLength(1);
    expect(attacker.handCards).toHaveLength(1);
  });

  it('grudge: source loses 1 HP when no hand cards', () => {
    const fz = makePlayer('p1', {
      seat: 0,
      mainGeneralId: 'SHU012',
      skills: ['enyuan_grudge'],
    });
    const attacker = makePlayer('p2', {
      seat: 1,
      hp: 4,
      maxHp: 4,
      handCards: [],
    });
    const game = makeGame([fz, attacker]);

    const ctx = createSkillContext({
      game,
      player: fz,
      event: {
        type: 'damage',
        source: attacker.id,
        target: fz.id,
        amount: 1,
      },
    });

    enyuanGrudge.activate(ctx);

    expect(attacker.hp).toBe(3);
  });
});
