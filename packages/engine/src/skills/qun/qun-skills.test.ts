import type { Card, CardId, GeneralId, SkillId } from '@sgs/data';
import { describe, expect, it } from 'vitest';
import type { GameState } from '../../state/game.js';
import type { PlayerState } from '../../state/player.js';
import type { PlayerId } from '../../state/types.js';
import { createSkillContext } from '../skill-context.js';
import { SkillRegistry } from '../skill-registry.js';
import { qunSkills, registerQunSkills } from './index.js';
import { jijiu, qingnang } from './qun001-huatuo.js';
import { wushuang } from './qun002-lvbu.js';
import { biyue, lijian } from './qun003-diaochan.js';
import { luanji } from './qun004-yuanshao.js';
import { shuangxiong } from './qun005-yanliang-wenchou.js';
import { benghuai, jiuchi } from './qun006-dongzhuo.js';
import { weimu, wansha } from './qun007-jiaxu.js';
import { mashuPangde, mengjin } from './qun008-pangde.js';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function makeCard(
  id: string,
  overrides: Partial<Card> = {},
): Card {
  return {
    id: id as CardId,
    name: overrides.name ?? 'TestCard',
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
    seat?: number;
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
    skills: (options.skills ?? []).map(s => s as SkillId),
    marks: {},
  };
}

function makeGame(
  players: PlayerState[],
  drawPile: Card[] = [],
  overrides: Partial<GameState> = {},
): GameState {
  return {
    players,
    drawPile:
      drawPile.length > 0
        ? drawPile
        : Array.from({ length: 10 }, (_, i) =>
            makeCard(`draw-${i}`, { name: 'DrawCard', suit: 'heart' }),
          ),
    discardPile: [],
    currentPlayerIndex: overrides.currentPlayerIndex ?? 0,
    currentPhase: overrides.currentPhase ?? 'play',
    turnCount: 1,
    activeEffects: [],
    gameOver: false,
    winnerFaction: null,
  };
}

/* ------------------------------------------------------------------ */
/*  Registration test                                                 */
/* ------------------------------------------------------------------ */

describe('QUN skill registration', () => {
  it('registers all 30 generals worth of skills without duplicate IDs', () => {
    const registry = new SkillRegistry();
    registerQunSkills(registry);

    const ids = new Set(qunSkills.map(s => s.id));
    expect(ids.size).toBe(qunSkills.length);

    // At minimum: 30 generals, most with 1-3 skills
    expect(qunSkills.length).toBeGreaterThanOrEqual(30);
  });

  it('retrieves every skill by its event triggers', () => {
    const registry = new SkillRegistry();
    registerQunSkills(registry);

    for (const skill of qunSkills) {
      for (const trigger of skill.triggers) {
        const found = registry.getSkillsForEvent(trigger);
        expect(found.map(s => s.id)).toContain(skill.id);
      }
    }
  });
});

/* ------------------------------------------------------------------ */
/*  QUN001 华佗 — 青囊 (Medicine)                                     */
/* ------------------------------------------------------------------ */

describe('qun_qingnang (华佗 — Medicine)', () => {
  it('discards 1 hand card to recover 1 HP for an injured player', () => {
    const huatuo = makePlayer('huatuo', {
      mainGeneralId: 'QUN001',
      skills: ['qun_qingnang'],
      handCards: [makeCard('h1', { suit: 'heart' }), makeCard('h2')],
    });
    const injured = makePlayer('injured', { hp: 2, maxHp: 4, seat: 1 });
    const game = makeGame([huatuo, injured]);

    const ctx = createSkillContext({
      game,
      player: huatuo,
      event: { type: 'phaseChange', player: huatuo.id, phase: 'play' },
    });

    expect(qingnang.canActivate(ctx)).toBe(true);
    qingnang.activate(ctx);

    // Discarded 1 card
    expect(huatuo.handCards).toHaveLength(1);
    expect(game.discardPile).toHaveLength(1);
    // Injured player recovered 1 HP
    expect(injured.hp).toBe(3);
  });

  it('does not activate when no player is missing HP', () => {
    const huatuo = makePlayer('huatuo', {
      mainGeneralId: 'QUN001',
      handCards: [makeCard('h1')],
    });
    const fullHp = makePlayer('p2', { hp: 4, maxHp: 4, seat: 1 });
    const game = makeGame([huatuo, fullHp]);

    const ctx = createSkillContext({
      game,
      player: huatuo,
      event: { type: 'phaseChange', player: huatuo.id, phase: 'play' },
    });

    expect(qingnang.canActivate(ctx)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  QUN002 吕布 — 无双 (Unrivaled)                                     */
/* ------------------------------------------------------------------ */

describe('qun_wushuang (吕布 — Unrivaled)', () => {
  it('creates requireDoubleDodge effect when playing 杀', () => {
    const lvbu = makePlayer('lvbu', {
      mainGeneralId: 'QUN002',
      skills: ['qun_wushuang'],
    });
    const target = makePlayer('target', { seat: 1 });
    const slashCard = makeCard('s1', { name: '杀' });
    const game = makeGame([lvbu, target]);

    const ctx = createSkillContext({
      game,
      player: lvbu,
      event: {
        type: 'playCard',
        player: lvbu.id,
        card: slashCard,
        targets: [target.id],
      },
    });

    expect(wushuang.canActivate(ctx)).toBe(true);
    wushuang.activate(ctx);

    const effect = game.activeEffects.find(e => e.name === 'wushuang');
    expect(effect).toBeDefined();
    expect(effect!.properties['requireDoubleDodge']).toBe(true);
    expect(effect!.targetPlayerIds).toContain(target.id);
  });

  it('creates requireDoubleSlash effect when playing 决斗', () => {
    const lvbu = makePlayer('lvbu', {
      mainGeneralId: 'QUN002',
      skills: ['qun_wushuang'],
    });
    const target = makePlayer('target', { seat: 1 });
    const duelCard = makeCard('d1', { name: '决斗' });
    const game = makeGame([lvbu, target]);

    const ctx = createSkillContext({
      game,
      player: lvbu,
      event: {
        type: 'playCard',
        player: lvbu.id,
        card: duelCard,
        targets: [target.id],
      },
    });

    expect(wushuang.canActivate(ctx)).toBe(true);
    wushuang.activate(ctx);

    const effect = game.activeEffects.find(e => e.name === 'wushuang');
    expect(effect).toBeDefined();
    expect(effect!.properties['requireDoubleSlash']).toBe(true);
  });

  it('does not activate for non-杀/决斗 cards', () => {
    const lvbu = makePlayer('lvbu', {
      mainGeneralId: 'QUN002',
      skills: ['qun_wushuang'],
    });
    const game = makeGame([lvbu]);

    const ctx = createSkillContext({
      game,
      player: lvbu,
      event: {
        type: 'playCard',
        player: lvbu.id,
        card: makeCard('p1', { name: '桃' }),
      },
    });

    expect(wushuang.canActivate(ctx)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  QUN003 貂蝉 — 闭月 (Eclipse)                                       */
/* ------------------------------------------------------------------ */

describe('qun_biyue (貂蝉 — Eclipse)', () => {
  it('draws 1 card at end phase', () => {
    const diaochan = makePlayer('diaochan', {
      mainGeneralId: 'QUN003',
      skills: ['qun_biyue'],
    });
    const game = makeGame([diaochan]);

    const ctx = createSkillContext({
      game,
      player: diaochan,
      event: { type: 'phaseChange', player: diaochan.id, phase: 'end' },
    });

    expect(biyue.canActivate(ctx)).toBe(true);
    biyue.activate(ctx);

    expect(diaochan.handCards).toHaveLength(1);
  });

  it('does not activate during play phase', () => {
    const diaochan = makePlayer('diaochan', {
      mainGeneralId: 'QUN003',
    });
    const game = makeGame([diaochan]);

    const ctx = createSkillContext({
      game,
      player: diaochan,
      event: { type: 'phaseChange', player: diaochan.id, phase: 'play' },
    });

    expect(biyue.canActivate(ctx)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  QUN003 貂蝉 — 离间 (Sow Discord)                                   */
/* ------------------------------------------------------------------ */

describe('qun_lijian (貂蝉 — Sow Discord)', () => {
  it('discards 1 card and creates forced duel effect between 2 players', () => {
    const diaochan = makePlayer('diaochan', {
      mainGeneralId: 'QUN003',
      skills: ['qun_lijian'],
      handCards: [makeCard('h1')],
    });
    const male1 = makePlayer('male1', { seat: 1 });
    const male2 = makePlayer('male2', { seat: 2 });
    const game = makeGame([diaochan, male1, male2]);

    const ctx = createSkillContext({
      game,
      player: diaochan,
      event: { type: 'phaseChange', player: diaochan.id, phase: 'play' },
    });

    expect(lijian.canActivate(ctx)).toBe(true);
    lijian.activate(ctx);

    expect(diaochan.handCards).toHaveLength(0);
    expect(game.discardPile).toHaveLength(1);

    const effect = game.activeEffects.find(e => e.name === 'lijian');
    expect(effect).toBeDefined();
    expect(effect!.properties['forcedDuel']).toBe(true);
    expect(effect!.targetPlayerIds).toHaveLength(2);
  });
});

/* ------------------------------------------------------------------ */
/*  QUN004 袁绍 — 乱击 (Chaos Strike)                                  */
/* ------------------------------------------------------------------ */

describe('qun_luanji (袁绍 — Chaos Strike)', () => {
  it('uses 2 same-suit cards as Rain of Arrows', () => {
    const yuanshao = makePlayer('yuanshao', {
      mainGeneralId: 'QUN004',
      skills: ['qun_luanji'],
      handCards: [
        makeCard('h1', { suit: 'heart' }),
        makeCard('h2', { suit: 'heart' }),
        makeCard('h3', { suit: 'spade' }),
      ],
    });
    const target = makePlayer('target', { seat: 1 });
    const game = makeGame([yuanshao, target]);

    const ctx = createSkillContext({
      game,
      player: yuanshao,
      event: {
        type: 'playCard',
        player: yuanshao.id,
        card: makeCard('trigger'),
      },
    });

    expect(luanji.canActivate(ctx)).toBe(true);
    luanji.activate(ctx);

    // 2 hearts discarded, 1 spade remains
    expect(yuanshao.handCards).toHaveLength(1);
    expect(yuanshao.handCards[0].suit).toBe('spade');
    expect(game.discardPile).toHaveLength(2);

    const effect = game.activeEffects.find(e => e.name === 'luanji');
    expect(effect).toBeDefined();
    expect(effect!.properties['rainOfArrows']).toBe(true);
    expect(effect!.targetPlayerIds).toContain(target.id);
  });

  it('does not activate without 2 same-suit cards', () => {
    const yuanshao = makePlayer('yuanshao', {
      mainGeneralId: 'QUN004',
      handCards: [
        makeCard('h1', { suit: 'heart' }),
        makeCard('h2', { suit: 'spade' }),
        makeCard('h3', { suit: 'club' }),
      ],
    });
    const game = makeGame([yuanshao]);

    const ctx = createSkillContext({
      game,
      player: yuanshao,
      event: {
        type: 'playCard',
        player: yuanshao.id,
        card: makeCard('trigger'),
      },
    });

    expect(luanji.canActivate(ctx)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  QUN005 颜良&文丑 — 双雄 (Dual Heroes)                              */
/* ------------------------------------------------------------------ */

describe('qun_shuangxiong (颜良&文丑 — Dual Heroes)', () => {
  it('keeps the card when judgment is red', () => {
    const yanliang = makePlayer('yanliang', {
      mainGeneralId: 'QUN005',
      skills: ['qun_shuangxiong'],
    });
    // Draw pile: top card is red (heart)
    const redCard = makeCard('j1', { suit: 'heart', name: 'JudgeCard' });
    const game = makeGame([yanliang], [redCard]);

    const ctx = createSkillContext({
      game,
      player: yanliang,
      event: { type: 'phaseChange', player: yanliang.id, phase: 'draw' },
    });

    expect(shuangxiong.canActivate(ctx)).toBe(true);
    shuangxiong.activate(ctx);

    // Red card kept
    expect(yanliang.handCards).toHaveLength(1);
    expect(yanliang.handCards[0].id).toBe('j1');
    expect(game.drawPile).toHaveLength(0);
  });

  it('creates demandCard effect when judgment is black', () => {
    const yanliang = makePlayer('yanliang', {
      mainGeneralId: 'QUN005',
      skills: ['qun_shuangxiong'],
    });
    const opponent = makePlayer('opponent', { seat: 1 });
    const blackCard = makeCard('j1', { suit: 'spade', name: 'JudgeCard' });
    const game = makeGame([yanliang, opponent], [blackCard]);

    const ctx = createSkillContext({
      game,
      player: yanliang,
      event: { type: 'phaseChange', player: yanliang.id, phase: 'draw' },
    });

    shuangxiong.activate(ctx);

    expect(yanliang.handCards).toHaveLength(0);
    expect(game.discardPile).toHaveLength(1);

    const effect = game.activeEffects.find(e => e.name === 'shuangxiong');
    expect(effect).toBeDefined();
    expect(effect!.properties['demandCard']).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  QUN006 董卓 — 酒池 (Wine Pool)                                      */
/* ------------------------------------------------------------------ */

describe('qun_jiuchi (董卓 — Wine Pool)', () => {
  it('uses a spade card as wine, creating wine effect', () => {
    const dongzhuo = makePlayer('dongzhuo', {
      mainGeneralId: 'QUN006',
      skills: ['qun_jiuchi'],
      handCards: [
        makeCard('s1', { suit: 'spade' }),
        makeCard('h1', { suit: 'heart' }),
      ],
    });
    const game = makeGame([dongzhuo]);

    const ctx = createSkillContext({
      game,
      player: dongzhuo,
      event: {
        type: 'playCard',
        player: dongzhuo.id,
        card: makeCard('trigger'),
      },
    });

    expect(jiuchi.canActivate(ctx)).toBe(true);
    jiuchi.activate(ctx);

    // Spade card consumed, heart remains
    expect(dongzhuo.handCards).toHaveLength(1);
    expect(dongzhuo.handCards[0].suit).toBe('heart');

    const effect = game.activeEffects.find(e => e.name === 'jiuchi');
    expect(effect).toBeDefined();
    expect(effect!.properties['wineEffect']).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  QUN006 董卓 — 崩坏 (Collapse)                                       */
/* ------------------------------------------------------------------ */

describe('qun_benghuai (董卓 — Collapse)', () => {
  it('loses 1 HP at end phase when HP is highest', () => {
    const dongzhuo = makePlayer('dongzhuo', {
      mainGeneralId: 'QUN006',
      skills: ['qun_benghuai'],
      hp: 8,
      maxHp: 8,
    });
    const other = makePlayer('other', { hp: 3, maxHp: 4, seat: 1 });
    const game = makeGame([dongzhuo, other]);

    const ctx = createSkillContext({
      game,
      player: dongzhuo,
      event: { type: 'phaseChange', player: dongzhuo.id, phase: 'end' },
    });

    expect(benghuai.canActivate(ctx)).toBe(true);
    benghuai.activate(ctx);

    expect(dongzhuo.hp).toBe(7);
  });

  it('does not activate when HP is not the highest', () => {
    const dongzhuo = makePlayer('dongzhuo', {
      mainGeneralId: 'QUN006',
      hp: 2,
      maxHp: 8,
    });
    const other = makePlayer('other', { hp: 4, maxHp: 4, seat: 1 });
    const game = makeGame([dongzhuo, other]);

    const ctx = createSkillContext({
      game,
      player: dongzhuo,
      event: { type: 'phaseChange', player: dongzhuo.id, phase: 'end' },
    });

    expect(benghuai.canActivate(ctx)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  QUN007 贾诩 — 完杀 (Complete Kill)                                  */
/* ------------------------------------------------------------------ */

describe('qun_wansha (贾诩 — Complete Kill)', () => {
  it('creates peach restriction effect during play phase', () => {
    const jiaxu = makePlayer('jiaxu', {
      mainGeneralId: 'QUN007',
      skills: ['qun_wansha'],
    });
    const other = makePlayer('other', { seat: 1 });
    const game = makeGame([jiaxu, other]);

    const ctx = createSkillContext({
      game,
      player: jiaxu,
      event: { type: 'phaseChange', player: jiaxu.id, phase: 'play' },
    });

    expect(wansha.canActivate(ctx)).toBe(true);
    wansha.activate(ctx);

    const effect = game.activeEffects.find(e => e.name === 'wansha');
    expect(effect).toBeDefined();
    expect(effect!.properties['peachRestriction']).toBe(true);
    expect(effect!.targetPlayerIds).toContain(other.id);
    expect(effect!.targetPlayerIds).not.toContain(jiaxu.id);
  });
});

/* ------------------------------------------------------------------ */
/*  QUN008 庞德 — 马术 (Horsemanship)                                   */
/* ------------------------------------------------------------------ */

describe('qun_mashu_pangde (庞德 — Horsemanship)', () => {
  it('creates distance reduction effect at prepare phase', () => {
    const pangde = makePlayer('pangde', {
      mainGeneralId: 'QUN008',
      skills: ['qun_mashu_pangde'],
    });
    const game = makeGame([pangde]);

    const ctx = createSkillContext({
      game,
      player: pangde,
      event: { type: 'phaseChange', player: pangde.id, phase: 'prepare' },
    });

    expect(mashuPangde.canActivate(ctx)).toBe(true);
    mashuPangde.activate(ctx);

    const effect = game.activeEffects.find(e => e.name === 'mashu_pangde');
    expect(effect).toBeDefined();
    expect(effect!.properties['distanceReduction']).toBe(1);
  });
});

/* ------------------------------------------------------------------ */
/*  QUN008 庞德 — 猛进 (Advance)                                        */
/* ------------------------------------------------------------------ */

describe('qun_mengjin (庞德 — Advance)', () => {
  it('discards 1 card from the dodge target', () => {
    const pangde = makePlayer('pangde', {
      mainGeneralId: 'QUN008',
      skills: ['qun_mengjin'],
    });
    const target = makePlayer('target', {
      seat: 1,
      handCards: [makeCard('t1'), makeCard('t2')],
    });
    const game = makeGame([pangde, target]);

    const ctx = createSkillContext({
      game,
      player: pangde,
      event: {
        type: 'response',
        player: target.id,
        accepted: true,
      },
    });

    expect(mengjin.canActivate(ctx)).toBe(true);
    mengjin.activate(ctx);

    expect(target.handCards).toHaveLength(1);
    expect(game.discardPile).toHaveLength(1);
  });

  it('does not activate when response is not accepted', () => {
    const pangde = makePlayer('pangde', {
      mainGeneralId: 'QUN008',
    });
    const target = makePlayer('target', { seat: 1 });
    const game = makeGame([pangde, target]);

    const ctx = createSkillContext({
      game,
      player: pangde,
      event: {
        type: 'response',
        player: target.id,
        accepted: false,
      },
    });

    expect(mengjin.canActivate(ctx)).toBe(false);
  });
});
