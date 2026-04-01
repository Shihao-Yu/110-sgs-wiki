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
import { tiejia } from './qun034-wutugu.js';
import { lirang } from './qun037-kongrong.js';
import { mieji } from './qun043-liru.js';
import { sougua } from './qun054-zhangrang.js';
import { pinping } from './qun060-xushao.js';

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
  it('registers all 60 generals worth of skills without duplicate IDs', () => {
    const registry = new SkillRegistry();
    registerQunSkills(registry);

    const ids = new Set(qunSkills.map(s => s.id));
    expect(ids.size).toBe(qunSkills.length);

    // At minimum: 60 generals, most with 1-3 skills
    expect(qunSkills.length).toBeGreaterThanOrEqual(60);
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

/* ------------------------------------------------------------------ */
/*  QUN034 兀突骨 — 铁甲 (Iron Armor)                                    */
/* ------------------------------------------------------------------ */

describe('qun_tiejia (兀突骨 — Iron Armor)', () => {
  it('reduces non-fire damage by 1', () => {
    const wutugu = makePlayer('wutugu', {
      mainGeneralId: 'QUN034',
      skills: ['qun_tiejia'],
      hp: 4,
      maxHp: 4,
    });
    const attacker = makePlayer('attacker', { seat: 1 });
    const game = makeGame([wutugu, attacker]);

    const event = {
      type: 'damage' as const,
      source: attacker.id,
      target: wutugu.id,
      amount: 2,
    };

    const ctx = createSkillContext({
      game,
      player: wutugu,
      event,
    });

    expect(tiejia.canActivate(ctx)).toBe(true);
    tiejia.activate(ctx);

    expect(event.amount).toBe(1);
  });

  it('does not reduce fire damage', () => {
    const wutugu = makePlayer('wutugu', {
      mainGeneralId: 'QUN034',
      skills: ['qun_tiejia'],
      hp: 4,
      maxHp: 4,
    });
    const attacker = makePlayer('attacker', { seat: 1 });
    const game = makeGame([wutugu, attacker]);

    const event = {
      type: 'damage' as const,
      source: attacker.id,
      target: wutugu.id,
      amount: 2,
      element: 'fire' as const,
    };

    const ctx = createSkillContext({
      game,
      player: wutugu,
      event,
    });

    expect(tiejia.canActivate(ctx)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  QUN037 孔融 — 礼让 (Courtesy)                                       */
/* ------------------------------------------------------------------ */

describe('qun_lirang (孔融 — Courtesy)', () => {
  it('transfers excess cards to another player during discard phase', () => {
    const kongrong = makePlayer('kongrong', {
      mainGeneralId: 'QUN037',
      skills: ['qun_lirang'],
      hp: 2,
      maxHp: 4,
      handCards: [
        makeCard('k1'),
        makeCard('k2'),
        makeCard('k3'),
        makeCard('k4'),
      ],
    });
    const ally = makePlayer('ally', { seat: 1, handCards: [] });
    const game = makeGame([kongrong, ally]);

    const ctx = createSkillContext({
      game,
      player: kongrong,
      event: { type: 'phaseChange', player: kongrong.id, phase: 'discard' },
    });

    // HP is 2, hand has 4 cards → 2 excess
    expect(lirang.canActivate(ctx)).toBe(true);
    lirang.activate(ctx);

    expect(kongrong.handCards).toHaveLength(2);
    expect(ally.handCards).toHaveLength(2);
  });

  it('does not activate when hand size is within HP limit', () => {
    const kongrong = makePlayer('kongrong', {
      mainGeneralId: 'QUN037',
      hp: 4,
      maxHp: 4,
      handCards: [makeCard('k1'), makeCard('k2')],
    });
    const game = makeGame([kongrong]);

    const ctx = createSkillContext({
      game,
      player: kongrong,
      event: { type: 'phaseChange', player: kongrong.id, phase: 'discard' },
    });

    expect(lirang.canActivate(ctx)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  QUN043 李儒 — 灭计 (Annihilate)                                      */
/* ------------------------------------------------------------------ */

describe('qun_mieji (李儒 — Annihilate)', () => {
  it('forces target to discard 2 cards when they have enough', () => {
    const liru = makePlayer('liru', {
      mainGeneralId: 'QUN043',
      skills: ['qun_mieji'],
      handCards: [makeCard('b1', { suit: 'spade' })],
    });
    const target = makePlayer('target', {
      seat: 1,
      hp: 3,
      maxHp: 4,
      handCards: [makeCard('t1'), makeCard('t2'), makeCard('t3')],
    });
    const game = makeGame([liru, target]);

    const ctx = createSkillContext({
      game,
      player: liru,
      event: { type: 'phaseChange', player: liru.id, phase: 'play' },
    });

    expect(mieji.canActivate(ctx)).toBe(true);
    mieji.activate(ctx);

    // Liru discarded the black card
    expect(liru.handCards).toHaveLength(0);
    // Target had 3 cards, forced to discard 2
    expect(target.handCards).toHaveLength(1);
    expect(target.hp).toBe(3); // HP unchanged
  });

  it('forces target to lose 1 HP when they have fewer than 2 cards', () => {
    const liru = makePlayer('liru', {
      mainGeneralId: 'QUN043',
      skills: ['qun_mieji'],
      handCards: [makeCard('b1', { suit: 'club' })],
    });
    const target = makePlayer('target', {
      seat: 1,
      hp: 3,
      maxHp: 4,
      handCards: [makeCard('t1')],
    });
    const game = makeGame([liru, target]);

    const ctx = createSkillContext({
      game,
      player: liru,
      event: { type: 'phaseChange', player: liru.id, phase: 'play' },
    });

    mieji.activate(ctx);

    expect(liru.handCards).toHaveLength(0);
    expect(target.handCards).toHaveLength(1); // Cards untouched
    expect(target.hp).toBe(2); // Lost 1 HP
  });
});

/* ------------------------------------------------------------------ */
/*  QUN054 张让 — 搜刮 (Extortion)                                       */
/* ------------------------------------------------------------------ */

describe('qun_sougua (张让 — Extortion)', () => {
  it('takes 1 card from up to 2 opponents during draw phase', () => {
    const zhangrang = makePlayer('zhangrang', {
      mainGeneralId: 'QUN054',
      skills: ['qun_sougua'],
      handCards: [],
    });
    const p2 = makePlayer('p2', {
      seat: 1,
      handCards: [makeCard('a1'), makeCard('a2')],
    });
    const p3 = makePlayer('p3', {
      seat: 2,
      handCards: [makeCard('b1')],
    });
    const game = makeGame([zhangrang, p2, p3]);

    const ctx = createSkillContext({
      game,
      player: zhangrang,
      event: { type: 'phaseChange', player: zhangrang.id, phase: 'draw' },
    });

    expect(sougua.canActivate(ctx)).toBe(true);
    sougua.activate(ctx);

    // Took 1 from each
    expect(zhangrang.handCards).toHaveLength(2);
    expect(p2.handCards).toHaveLength(1);
    expect(p3.handCards).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ */
/*  QUN060 许劭 — 品评 (Appraisal)                                       */
/* ------------------------------------------------------------------ */

describe('qun_pinping (许劭 — Appraisal)', () => {
  it('rearranges top 3 draw pile cards by number descending', () => {
    const xushao = makePlayer('xushao', {
      mainGeneralId: 'QUN060',
      skills: ['qun_pinping'],
    });
    const drawPile = [
      makeCard('d1', { number: 3 }),
      makeCard('d2', { number: 10 }),
      makeCard('d3', { number: 7 }),
      makeCard('d4', { number: 1 }),
    ];
    const game = makeGame([xushao], drawPile);

    const ctx = createSkillContext({
      game,
      player: xushao,
      event: { type: 'phaseChange', player: xushao.id, phase: 'prepare' },
    });

    expect(pinping.canActivate(ctx)).toBe(true);
    pinping.activate(ctx);

    // Top 3 sorted descending: 10, 7, 3 — then the untouched 4th card
    expect(game.drawPile[0].number).toBe(10);
    expect(game.drawPile[1].number).toBe(7);
    expect(game.drawPile[2].number).toBe(3);
    expect(game.drawPile[3].number).toBe(1);
  });

  it('does not activate when draw pile has fewer than 3 cards', () => {
    const xushao = makePlayer('xushao', {
      mainGeneralId: 'QUN060',
    });
    const game = makeGame([xushao], [makeCard('d1'), makeCard('d2')]);

    const ctx = createSkillContext({
      game,
      player: xushao,
      event: { type: 'phaseChange', player: xushao.id, phase: 'prepare' },
    });

    expect(pinping.canActivate(ctx)).toBe(false);
  });
});
