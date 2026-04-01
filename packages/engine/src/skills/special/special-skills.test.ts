import type { Card, CardId, GeneralId, SkillId } from '@sgs/data';
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
} from './index.js';
import { liuqiPlaceholder } from './qun-shu072-liuqi.js';
import { xuyouPlaceholder } from './qun-wei066-xuyou.js';
import { shixiePlaceholder } from './qun-wu051-shixie.js';
import { mifangFushirenPlaceholder } from './shu-wu071-mifang-fushiren.js';
import { mengdaPlaceholder } from './wei-shu079-mengda.js';
import { tangziPlaceholder } from './wei-wu072-tangzi.js';
import { wenyangPlaceholder } from './wei-wu074-wenyang.js';
import { shichangshiPlaceholder } from './qun000-shichangshi.js';

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
    skills: (options.skills ?? []).map(s => s as SkillId),
    marks: {},
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
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

describe('Special generals — dual-faction and unique mechanics', () => {
  it('registers all 8 special general skills without duplicate ID errors', () => {
    const registry = new SkillRegistry();
    registerSpecialSkills(registry);

    // Each general contributes at least one skill, total should be 8
    expect(specialSkills.length).toBe(8);
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

    const shichangshiSkills = registry.getSkillsForGeneral('general_qun_000' as GeneralId);
    expect(shichangshiSkills).toHaveLength(1);
    expect(shichangshiSkills[0].id).toBe('special_qun_000_placeholder');
  });

  it('all skill IDs are unique across the special registry', () => {
    const ids = specialSkills.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
