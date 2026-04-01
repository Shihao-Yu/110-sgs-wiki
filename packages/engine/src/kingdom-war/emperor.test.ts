import { beforeEach, describe, expect, it } from 'vitest';
import type { Card, Faction, General, GeneralId, SkillId } from '@sgs/data';
import type { GameState } from '../state/game.js';
import type { PlayerState } from '../state/player.js';
import type { PlayerId } from '../state/types.js';
import { KingdomWarManager } from './kingdom-war-manager.js';
import { EmperorManager } from './emperor.js';

function makePlayer(id: string, seat: number): PlayerState {
  return {
    id: id as PlayerId,
    name: `Player ${id}`,
    seat,
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
  };
}

function makeGame(players: PlayerState[]): GameState {
  return {
    players,
    drawPile: [] as Card[],
    discardPile: [] as Card[],
    currentPlayerIndex: 0,
    currentPhase: 'play',
    turnCount: 1,
    activeEffects: [],
    gameOver: false,
    winnerFaction: null,
  };
}

function makeGeneral(
  id: string,
  faction: Faction,
  hp: number,
  skillNames: string[] = [],
): General {
  return {
    id: id as GeneralId,
    name: id,
    title: `${id} title`,
    faction,
    hp,
    maxHp: hp,
    gender: 'male',
    skills: skillNames.map((s) => s as SkillId),
    image: `${id}.png`,
    pack: '国战',
  };
}

describe('EmperorManager', () => {
  let kwManager: KingdomWarManager;
  let empManager: EmperorManager;
  let game: GameState;
  let p1: PlayerState;
  let p2: PlayerState;

  const liubei = makeGeneral('liubei', 'SHU', 4, ['rende']);
  const guanyu = makeGeneral('guanyu', 'SHU', 3, ['wusheng']);
  const caocao = makeGeneral('caocao', 'WEI', 4, ['jianxiong']);
  const dianwei = makeGeneral('dianwei', 'WEI', 4, ['qiangxi']);
  const sunquan = makeGeneral('sunquan', 'WU', 4, ['zhiheng']);
  const zhouyu = makeGeneral('zhouyu', 'WU', 3, ['yingzi']);
  const zhangjiao = makeGeneral('zhangjiao', 'QUN', 3, ['leiji']);
  const lvbu = makeGeneral('lvbu', 'QUN', 4, ['wushuang']);

  beforeEach(() => {
    kwManager = new KingdomWarManager();
    empManager = new EmperorManager(kwManager);
    p1 = makePlayer('p1', 0);
    p2 = makePlayer('p2', 1);
    game = makeGame([p1, p2]);
  });

  // ---------------------------------------------------------------
  // 1. Emperor identification
  // ---------------------------------------------------------------
  it('identifies official emperor generals', () => {
    expect(empManager.isEmperorGeneral('liubei' as GeneralId)).toBe(true);
    expect(empManager.isEmperorGeneral('caocao' as GeneralId)).toBe(true);
    expect(empManager.isEmperorGeneral('sunquan' as GeneralId)).toBe(true);
    expect(empManager.isEmperorGeneral('zhangjiao' as GeneralId)).toBe(true);
  });

  it('returns false for non-emperor generals', () => {
    expect(empManager.isEmperorGeneral('guanyu' as GeneralId)).toBe(false);
    expect(empManager.isEmperorGeneral('dianwei' as GeneralId)).toBe(false);
    expect(empManager.isEmperorGeneral('zhouyu' as GeneralId)).toBe(false);
  });

  // ---------------------------------------------------------------
  // 2. Emperor info retrieval
  // ---------------------------------------------------------------
  it('returns emperor info with correct faction and leader skills', () => {
    const info = empManager.getEmperorInfo('liubei' as GeneralId);

    expect(info).not.toBeNull();
    expect(info!.faction).toBe('SHU');
    expect(info!.name).toBe('刘备');
    expect(info!.leaderSkills).toContain('jijiang' as SkillId);
  });

  it('returns null for non-emperor general info', () => {
    expect(empManager.getEmperorInfo('guanyu' as GeneralId)).toBeNull();
  });

  // ---------------------------------------------------------------
  // 3. Emperor for faction lookup
  // ---------------------------------------------------------------
  it('retrieves the emperor for each faction', () => {
    expect(empManager.getEmperorForFaction('SHU')?.generalId).toBe('liubei');
    expect(empManager.getEmperorForFaction('WEI')?.generalId).toBe('caocao');
    expect(empManager.getEmperorForFaction('WU')?.generalId).toBe('sunquan');
    expect(empManager.getEmperorForFaction('QUN')?.generalId).toBe('zhangjiao');
  });

  it('returns null for JIN faction (no emperor registered)', () => {
    expect(empManager.getEmperorForFaction('JIN')).toBeNull();
  });

  // ---------------------------------------------------------------
  // 4. Emperor reveal activates leader skills
  // ---------------------------------------------------------------
  it('activates leader-only skills when emperor is revealed as first of faction', () => {
    kwManager.assignGenerals(p1, liubei, guanyu);
    kwManager.revealGeneral(game, p1, 'main');

    const activated = empManager.handleEmperorReveal(game, p1);

    expect(activated).toContain('jijiang' as SkillId);
    expect(p1.skills).toContain('jijiang' as SkillId);
    expect(empManager.isFactionLeader(p1, 'SHU')).toBe(true);
  });

  // ---------------------------------------------------------------
  // 5. Second revealer does NOT become leader
  // ---------------------------------------------------------------
  it('does not grant leader skills to a second player revealing the same faction', () => {
    kwManager.assignGenerals(p1, liubei, guanyu);
    kwManager.assignGenerals(p2, guanyu, liubei);

    // p1 reveals first — becomes SHU leader
    kwManager.revealGeneral(game, p1, 'main');
    empManager.handleEmperorReveal(game, p1);

    // p2 reveals — also has liubei as deputy, but p1 is already leader
    kwManager.revealGeneral(game, p2, 'deputy');
    const activated = empManager.handleEmperorReveal(game, p2);

    expect(activated).toEqual([]);
    expect(empManager.isFactionLeader(p2, 'SHU')).toBe(false);
  });

  // ---------------------------------------------------------------
  // 6. Non-emperor reveal returns empty array
  // ---------------------------------------------------------------
  it('returns empty array when revealed general is not an emperor', () => {
    kwManager.assignGenerals(p1, guanyu, dianwei);
    kwManager.revealGeneral(game, p1, 'main');

    const activated = empManager.handleEmperorReveal(game, p1);

    expect(activated).toEqual([]);
  });

  // ---------------------------------------------------------------
  // 7. Unrevealed emperor slot does not activate
  // ---------------------------------------------------------------
  it('does not activate leader skills if the emperor slot is not revealed', () => {
    kwManager.assignGenerals(p1, liubei, guanyu);
    // Reveal deputy only (guanyu), not main (liubei the emperor)
    kwManager.revealGeneral(game, p1, 'deputy');

    const activated = empManager.handleEmperorReveal(game, p1);

    expect(activated).toEqual([]);
    expect(empManager.isFactionLeader(p1, 'SHU')).toBe(false);
  });

  // ---------------------------------------------------------------
  // 8. All four factions have registered emperors
  // ---------------------------------------------------------------
  it('has exactly four official emperor generals', () => {
    const allEmperors = empManager.getAllEmperors();

    expect(allEmperors).toHaveLength(4);

    const factions = allEmperors.map((e) => e.faction).sort();
    expect(factions).toEqual(['QUN', 'SHU', 'WEI', 'WU']);
  });

  // ---------------------------------------------------------------
  // 9. getFactionLeader returns correct player id
  // ---------------------------------------------------------------
  it('tracks the faction leader player id', () => {
    kwManager.assignGenerals(p1, caocao, dianwei);
    kwManager.revealGeneral(game, p1, 'main');
    empManager.handleEmperorReveal(game, p1);

    expect(empManager.getFactionLeader('WEI')).toBe(p1.id);
    expect(empManager.getFactionLeader('SHU')).toBeNull();
  });
});
