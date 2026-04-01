import type { Card, CardId, Faction, GeneralId, SkillId } from '@sgs/data';
import { describe, expect, it } from 'vitest';
import type { GameState } from '../../state/game.js';
import type { PlayerState } from '../../state/player.js';
import type { PlayerId } from '../../state/types.js';
import { createSkillContext } from '../skill-context.js';
import { SkillRegistry } from '../skill-registry.js';
import {
  specialSkills,
  registerSpecialSkills,
  LIUQI_FACTIONS,
  XUYOU_FACTIONS,
  SHIXIE_FACTIONS,
  MIFANG_FUSHIREN_FACTIONS,
  MENGDA_FACTIONS,
  TANGZI_FACTIONS,
  WENYANG_FACTIONS,
  SHICHANGSHI_MULTI_CHARACTER,
  EMPEROR_FACTIONS,
  SHICHANGSHI_SUB_COUNT,
} from './index.js';
import { liuqiPlaceholder } from './qun-shu072-liuqi.js';
import { xuyouPlaceholder } from './qun-wei066-xuyou.js';
import { shixiePlaceholder } from './qun-wu051-shixie.js';
import { mifangFushirenPlaceholder } from './shu-wu071-mifang-fushiren.js';
import { mengdaPlaceholder } from './wei-shu079-mengda.js';
import { tangziPlaceholder } from './wei-wu072-tangzi.js';
import { wenyangPlaceholder } from './wei-wu074-wenyang.js';
import { shichangshiPlaceholder } from './qun000-shichangshi.js';
import { huoluan, shichangshiInit, SUB_CHARACTER_COUNT } from './shichangshi-skills.js';
import { jijiang, jiuyuan, hujia, huangtian, emperorSkills } from './emperor-skills.js';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function makeCard(id: string): Card {
  return {
    id: id as CardId,
    name: 'TestCard',
    type: 'basic',
    suit: 'spade',
    number: 7,
    description: '',
  };
}

function makePlayer(
  id: string,
  options: {
    mainGeneralId?: string;
    skills?: string[];
    seat?: number;
    faction?: Faction | null;
    hp?: number;
    maxHp?: number;
    handCards?: Card[];
    marks?: Record<string, number>;
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
    faction: options.faction ?? null,
    alive: true,
    skills: (options.skills ?? []).map(s => s as SkillId),
    marks: options.marks ?? {},
  };
}

function makeGame(players: PlayerState[]): GameState {
  return {
    players,
    drawPile: [makeCard('d1'), makeCard('d2'), makeCard('d3')],
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
/*  Tests — original dual-faction and unique mechanics                */
/* ------------------------------------------------------------------ */

describe('Special generals — dual-faction and unique mechanics', () => {
  it('registers all special general skills without duplicate ID errors', () => {
    const registry = new SkillRegistry();
    registerSpecialSkills(registry);

    // 8 original + 3 shichangshi skills + 4 emperor skills = 15
    expect(specialSkills.length).toBe(15);
  });

  it('all dual-faction placeholder skills have canActivate returning false', () => {
    const placeholders = [
      liuqiPlaceholder,
      xuyouPlaceholder,
      shixiePlaceholder,
      mifangFushirenPlaceholder,
      mengdaPlaceholder,
      tangziPlaceholder,
      wenyangPlaceholder,
      shichangshiPlaceholder,
    ];

    const player = makePlayer('p1', { mainGeneralId: 'any' });
    const game = makeGame([player]);

    for (const skill of placeholders) {
      const ctx = createSkillContext({
        game,
        player,
        event: { type: 'phaseChange', player: player.id, phase: 'prepare' },
      });

      expect(skill.canActivate(ctx)).toBe(false);
    }
  });

  it('dual-faction generals reference correct general IDs from data', () => {
    expect(liuqiPlaceholder.generalId).toBe('general_qun_072');
    expect(xuyouPlaceholder.generalId).toBe('general_qun_066');
    expect(shixiePlaceholder.generalId).toBe('general_qun_051');
    expect(mifangFushirenPlaceholder.generalId).toBe('general_shu_071');
    expect(mengdaPlaceholder.generalId).toBe('general_wei_079');
    expect(tangziPlaceholder.generalId).toBe('general_wei_072');
    expect(wenyangPlaceholder.generalId).toBe('general_wei_074');
    expect(shichangshiPlaceholder.generalId).toBe('general_qun_000');
  });

  it('dual-faction metadata specifies correct primary and secondary factions', () => {
    expect(LIUQI_FACTIONS).toEqual({ primary: 'QUN', secondary: 'SHU' });
    expect(XUYOU_FACTIONS).toEqual({ primary: 'QUN', secondary: 'WEI' });
    expect(SHIXIE_FACTIONS).toEqual({ primary: 'QUN', secondary: 'WU' });
    expect(MIFANG_FUSHIREN_FACTIONS).toEqual({ primary: 'SHU', secondary: 'WU' });
    expect(MENGDA_FACTIONS).toEqual({ primary: 'WEI', secondary: 'SHU' });
    expect(TANGZI_FACTIONS).toEqual({ primary: 'WEI', secondary: 'WU' });
    expect(WENYANG_FACTIONS).toEqual({ primary: 'WEI', secondary: 'WU' });
  });

  it('十常侍 is marked as multi-character', () => {
    expect(SHICHANGSHI_MULTI_CHARACTER).toBe(true);
  });

  it('skills are retrievable by general ID after registration', () => {
    const registry = new SkillRegistry();
    registerSpecialSkills(registry);

    const liuqiSkills = registry.getSkillsForGeneral('general_qun_072' as GeneralId);
    expect(liuqiSkills).toHaveLength(1);
    expect(liuqiSkills[0].id).toBe('special_qun_shu_072_placeholder');

    const mengdaSkills = registry.getSkillsForGeneral('general_wei_079' as GeneralId);
    expect(mengdaSkills).toHaveLength(1);
    expect(mengdaSkills[0].id).toBe('special_wei_shu_079_placeholder');

    // 十常侍 now has 4 skills: 1 placeholder + 3 mechanic skills
    const shichangshiAllSkills = registry.getSkillsForGeneral('general_qun_000' as GeneralId);
    expect(shichangshiAllSkills).toHaveLength(4);
  });

  it('all skill IDs are unique across the special registry', () => {
    const ids = specialSkills.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

/* ------------------------------------------------------------------ */
/*  Tests — 十常侍 unique mechanics                                    */
/* ------------------------------------------------------------------ */

describe('十常侍 (Shi Chang Shi) — unique multi-character mechanics', () => {
  it('shichangshiInit sets alive count on first prepare phase', () => {
    const player = makePlayer('p1', {
      mainGeneralId: 'general_qun_000',
      maxHp: 4,
      hp: 4,
    });
    const game = makeGame([player]);
    game.turnCount = 1;

    const ctx = createSkillContext({
      game,
      player,
      event: { type: 'phaseChange', player: player.id, phase: 'prepare' },
    });

    expect(shichangshiInit.canActivate(ctx)).toBe(true);
    shichangshiInit.activate(ctx);
    expect(player.marks['shichangshi_alive']).toBe(SUB_CHARACTER_COUNT);
  });

  it('shichangshiInit does not re-initialize if mark already set', () => {
    const player = makePlayer('p1', {
      mainGeneralId: 'general_qun_000',
      marks: { shichangshi_alive: 3 },
    });
    const game = makeGame([player]);
    game.turnCount = 1;

    const ctx = createSkillContext({
      game,
      player,
      event: { type: 'phaseChange', player: player.id, phase: 'prepare' },
    });

    expect(shichangshiInit.canActivate(ctx)).toBe(false);
  });

  it('huoluan prevents death when sub-characters remain and deals damage', () => {
    const lord = makePlayer('p1', {
      mainGeneralId: 'general_qun_000',
      hp: 0,
      maxHp: 4,
      marks: { shichangshi_alive: 3 },
    });
    const opponent = makePlayer('p2', { seat: 1, hp: 4, maxHp: 4 });
    const game = makeGame([lord, opponent]);

    const ctx = createSkillContext({
      game,
      player: lord,
      event: { type: 'death', player: lord.id },
    });

    expect(huoluan.canActivate(ctx)).toBe(true);
    huoluan.activate(ctx);

    // Sub-character count decremented
    expect(lord.marks['shichangshi_alive']).toBe(2);
    // Player stays alive
    expect(lord.alive).toBe(true);
    // MaxHp reduced by 1 (lost sub-character segment)
    expect(lord.maxHp).toBe(3);
  });

  it('huoluan does not activate on the last sub-character death', () => {
    const lord = makePlayer('p1', {
      mainGeneralId: 'general_qun_000',
      hp: 0,
      maxHp: 1,
      marks: { shichangshi_alive: 1 },
    });
    const game = makeGame([lord]);

    const ctx = createSkillContext({
      game,
      player: lord,
      event: { type: 'death', player: lord.id },
    });

    // Only 1 remaining — the final death should proceed normally
    expect(huoluan.canActivate(ctx)).toBe(false);
  });

  it('SUB_CHARACTER_COUNT is exported and equals 4', () => {
    expect(SHICHANGSHI_SUB_COUNT).toBe(4);
  });
});

/* ------------------------------------------------------------------ */
/*  Tests — Emperor lord skills                                       */
/* ------------------------------------------------------------------ */

describe('Emperor generals — lord-only skills (主公技)', () => {
  it('all 4 emperor skills are registered with unique IDs', () => {
    expect(emperorSkills).toHaveLength(4);
    const ids = emperorSkills.map(s => s.id);
    expect(new Set(ids).size).toBe(4);
  });

  it('EMPEROR_FACTIONS maps each emperor to the correct faction', () => {
    expect(EMPEROR_FACTIONS['general_em_001']).toBe('SHU');
    expect(EMPEROR_FACTIONS['general_em_002']).toBe('QUN');
    expect(EMPEROR_FACTIONS['general_em_003']).toBe('WU');
    expect(EMPEROR_FACTIONS['general_em_004']).toBe('WEI');
  });

  it('激将 (jijiang) activates for lord with SHU allies in play phase', () => {
    const lord = makePlayer('lord', {
      seat: 0,
      mainGeneralId: 'general_em_001',
      faction: 'SHU',
    });
    const shuAlly = makePlayer('ally', {
      seat: 1,
      faction: 'SHU',
      handCards: [makeCard('sha1')],
    });
    const game = makeGame([lord, shuAlly]);

    const ctx = createSkillContext({
      game,
      player: lord,
      event: { type: 'phaseChange', player: lord.id, phase: 'play' },
    });

    expect(jijiang.canActivate(ctx)).toBe(true);
  });

  it('激将 does not activate for non-lord players', () => {
    const nonLord = makePlayer('p1', {
      seat: 2, // Not seat 0 → not lord
      mainGeneralId: 'general_em_001',
      faction: 'SHU',
    });
    const shuAlly = makePlayer('ally', {
      seat: 1,
      faction: 'SHU',
      handCards: [makeCard('sha1')],
    });
    const game = makeGame([nonLord, shuAlly]);

    const ctx = createSkillContext({
      game,
      player: nonLord,
      event: { type: 'phaseChange', player: nonLord.id, phase: 'play' },
    });

    expect(jijiang.canActivate(ctx)).toBe(false);
  });

  it('激将 activate consumes a card from SHU ally', () => {
    const lord = makePlayer('lord', {
      seat: 0,
      mainGeneralId: 'general_em_001',
      faction: 'SHU',
    });
    const shuAlly = makePlayer('ally', {
      seat: 1,
      faction: 'SHU',
      handCards: [makeCard('sha1'), makeCard('sha2')],
    });
    const game = makeGame([lord, shuAlly]);

    const ctx = createSkillContext({
      game,
      player: lord,
      event: { type: 'phaseChange', player: lord.id, phase: 'play' },
    });

    jijiang.activate(ctx);

    // One card consumed from ally
    expect(shuAlly.handCards).toHaveLength(1);
    // Card moved to discard pile
    expect(game.discardPile.some(c => c.id === ('sha1' as CardId))).toBe(true);
  });

  it('护驾 (hujia) activates for lord with WEI allies on response', () => {
    const lord = makePlayer('lord', {
      seat: 0,
      mainGeneralId: 'general_em_004',
      faction: 'WEI',
    });
    const weiAlly = makePlayer('ally', {
      seat: 1,
      faction: 'WEI',
      handCards: [makeCard('shan1')],
    });
    const game = makeGame([lord, weiAlly]);

    const ctx = createSkillContext({
      game,
      player: lord,
      event: { type: 'response', player: lord.id, accepted: false },
    });

    expect(hujia.canActivate(ctx)).toBe(true);
  });

  it('护驾 does not activate when no WEI allies have cards', () => {
    const lord = makePlayer('lord', {
      seat: 0,
      mainGeneralId: 'general_em_004',
      faction: 'WEI',
    });
    const weiAlly = makePlayer('ally', {
      seat: 1,
      faction: 'WEI',
      handCards: [], // No cards
    });
    const game = makeGame([lord, weiAlly]);

    const ctx = createSkillContext({
      game,
      player: lord,
      event: { type: 'response', player: lord.id, accepted: false },
    });

    expect(hujia.canActivate(ctx)).toBe(false);
  });

  it('救援 (jiuyuan) activates for dying lord with WU allies', () => {
    const lord = makePlayer('lord', {
      seat: 0,
      mainGeneralId: 'general_em_003',
      faction: 'WU',
      hp: 0,
    });
    const wuAlly = makePlayer('ally', {
      seat: 1,
      faction: 'WU',
    });
    const game = makeGame([lord, wuAlly]);

    const ctx = createSkillContext({
      game,
      player: lord,
      event: { type: 'recover', target: lord.id, amount: 1 },
    });

    expect(jiuyuan.canActivate(ctx)).toBe(true);
  });

  it('救援 does not activate when lord HP > 0', () => {
    const lord = makePlayer('lord', {
      seat: 0,
      mainGeneralId: 'general_em_003',
      faction: 'WU',
      hp: 2,
    });
    const wuAlly = makePlayer('ally', { seat: 1, faction: 'WU' });
    const game = makeGame([lord, wuAlly]);

    const ctx = createSkillContext({
      game,
      player: lord,
      event: { type: 'recover', target: lord.id, amount: 1 },
    });

    expect(jiuyuan.canActivate(ctx)).toBe(false);
  });

  it('救援 activate grants +1 bonus HP recovery', () => {
    const lord = makePlayer('lord', {
      seat: 0,
      mainGeneralId: 'general_em_003',
      faction: 'WU',
      hp: 0,
      maxHp: 4,
    });
    const wuAlly = makePlayer('ally', { seat: 1, faction: 'WU' });
    const game = makeGame([lord, wuAlly]);

    const ctx = createSkillContext({
      game,
      player: lord,
      event: { type: 'recover', target: lord.id, amount: 1 },
    });

    jiuyuan.activate(ctx);
    // HP should have +1 bonus (the base recovery is handled elsewhere)
    expect(lord.hp).toBe(1);
  });

  it('黄天 (huangtian) activates for lord with QUN allies during play phase', () => {
    const lord = makePlayer('lord', {
      seat: 0,
      mainGeneralId: 'general_em_002',
      faction: 'QUN',
    });
    const qunAlly = makePlayer('ally', {
      seat: 1,
      faction: 'QUN',
      handCards: [makeCard('shan1')],
    });
    const game = makeGame([lord, qunAlly]);

    const ctx = createSkillContext({
      game,
      player: lord,
      event: { type: 'phaseChange', player: lord.id, phase: 'play' },
    });

    expect(huangtian.canActivate(ctx)).toBe(true);
  });

  it('黄天 activate transfers a card from QUN ally to lord', () => {
    const lord = makePlayer('lord', {
      seat: 0,
      mainGeneralId: 'general_em_002',
      faction: 'QUN',
      handCards: [],
    });
    const qunAlly = makePlayer('ally', {
      seat: 1,
      faction: 'QUN',
      handCards: [makeCard('shan1')],
    });
    const game = makeGame([lord, qunAlly]);

    const ctx = createSkillContext({
      game,
      player: lord,
      event: { type: 'phaseChange', player: lord.id, phase: 'play' },
    });

    huangtian.activate(ctx);

    // Card transferred from ally to lord
    expect(lord.handCards).toHaveLength(1);
    expect(lord.handCards[0].id).toBe('shan1' as CardId);
    expect(qunAlly.handCards).toHaveLength(0);
  });

  it('emperor skills are retrievable by general ID after registration', () => {
    const registry = new SkillRegistry();
    registerSpecialSkills(registry);

    const liubeiSkills = registry.getSkillsForGeneral('general_em_001' as GeneralId);
    expect(liubeiSkills).toHaveLength(1);
    expect(liubeiSkills[0].id).toBe('emperor_jijiang');

    const sunquanSkills = registry.getSkillsForGeneral('general_em_003' as GeneralId);
    expect(sunquanSkills).toHaveLength(1);
    expect(sunquanSkills[0].id).toBe('emperor_jiuyuan');

    const caocaoSkills = registry.getSkillsForGeneral('general_em_004' as GeneralId);
    expect(caocaoSkills).toHaveLength(1);
    expect(caocaoSkills[0].id).toBe('emperor_hujia');

    const zhangjiaoSkills = registry.getSkillsForGeneral('general_em_002' as GeneralId);
    expect(zhangjiaoSkills).toHaveLength(1);
    expect(zhangjiaoSkills[0].id).toBe('emperor_huangtian');
  });
});
