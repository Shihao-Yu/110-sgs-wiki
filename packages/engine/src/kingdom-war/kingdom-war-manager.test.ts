import { describe, it, expect, beforeEach } from 'vitest';
import type { Faction, General, GeneralId, SkillId } from '@sgs/data';
import type { GameState } from '../state/game.js';
import type { PlayerState } from '../state/player.js';
import type { PlayerId } from '../state/types.js';
import { KingdomWarManager } from './kingdom-war-manager.js';

function makeGeneral(overrides: Partial<General> = {}): General {
  return {
    id: 'g_default' as GeneralId,
    name: '赵云',
    title: '少年将军',
    faction: 'SHU' as Faction,
    hp: 4,
    maxHp: 4,
    gender: 'male',
    skills: ['longdan' as SkillId],
    image: '',
    pack: 'standard',
    ...overrides,
  };
}

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

describe('KingdomWarManager', () => {
  let kw: KingdomWarManager;
  let p1: PlayerState;
  let p2: PlayerState;
  let game: GameState;

  beforeEach(() => {
    kw = new KingdomWarManager();
    p1 = makePlayer('p1', 0);
    p2 = makePlayer('p2', 1);
    game = makeGame([p1, p2]);
  });

  describe('calculateDualHp', () => {
    it('calculates ceil(hp1/2) + ceil(hp2/2) for 4+3 = 4', () => {
      const main = makeGeneral({ hp: 4 });
      const deputy = makeGeneral({ hp: 3 });

      const hp = kw.calculateDualHp(main, deputy);

      // ceil(4/2) + ceil(3/2) = 2 + 2 = 4
      expect(hp).toBe(4);
    });

    it('calculates ceil(hp1/2) + ceil(hp2/2) for 3+3 = 4', () => {
      const main = makeGeneral({ hp: 3 });
      const deputy = makeGeneral({ hp: 3 });

      // ceil(3/2) + ceil(3/2) = 2 + 2 = 4
      expect(kw.calculateDualHp(main, deputy)).toBe(4);
    });

    it('calculates ceil(hp1/2) + ceil(hp2/2) for 4+4 = 4', () => {
      const main = makeGeneral({ hp: 4 });
      const deputy = makeGeneral({ hp: 4 });

      // ceil(4/2) + ceil(4/2) = 2 + 2 = 4
      expect(kw.calculateDualHp(main, deputy)).toBe(4);
    });

    it('calculates ceil(hp1/2) + ceil(hp2/2) for 5+3 = 5', () => {
      const main = makeGeneral({ hp: 5 });
      const deputy = makeGeneral({ hp: 3 });

      // ceil(5/2) + ceil(3/2) = 3 + 2 = 5
      expect(kw.calculateDualHp(main, deputy)).toBe(5);
    });
  });

  describe('assignGenerals', () => {
    it('sets both generals face-down with calculated HP', () => {
      const main = makeGeneral({ id: 'guan_yu' as GeneralId, hp: 4 });
      const deputy = makeGeneral({ id: 'zhao_yun' as GeneralId, hp: 3 });

      kw.assignGenerals(p1, main, deputy);

      expect(p1.mainGeneral).toEqual({ generalId: 'guan_yu', revealed: false });
      expect(p1.deputyGeneral).toEqual({ generalId: 'zhao_yun', revealed: false });
      expect(p1.hp).toBe(4); // ceil(4/2)+ceil(3/2)
      expect(p1.maxHp).toBe(4);
      expect(p1.faction).toBeNull();
      expect(p1.skills).toEqual([]);
    });
  });

  describe('revealGeneral', () => {
    const mainGeneral = makeGeneral({
      id: 'liu_bei' as GeneralId,
      faction: 'SHU' as Faction,
      hp: 4,
      skills: ['rende' as SkillId, 'jijiang' as SkillId],
    });
    const deputyGeneral = makeGeneral({
      id: 'zhao_yun' as GeneralId,
      faction: 'SHU' as Faction,
      hp: 3,
      skills: ['longdan' as SkillId],
    });

    beforeEach(() => {
      kw.assignGenerals(p1, mainGeneral, deputyGeneral);
    });

    it('reveals faction when main general is revealed', () => {
      kw.revealGeneral(game, p1, 'main', { main: mainGeneral, deputy: deputyGeneral });

      expect(p1.mainGeneral!.revealed).toBe(true);
      expect(p1.faction).toBe('SHU');
    });

    it('reveals faction when deputy general is revealed', () => {
      kw.revealGeneral(game, p1, 'deputy', { main: mainGeneral, deputy: deputyGeneral });

      expect(p1.deputyGeneral!.revealed).toBe(true);
      // Faction comes from the main general even when deputy is revealed first.
      expect(p1.faction).toBe('SHU');
    });

    it('unlocks the revealed general skills', () => {
      kw.revealGeneral(game, p1, 'main', { main: mainGeneral, deputy: deputyGeneral });

      expect(p1.skills).toContain('rende');
      expect(p1.skills).toContain('jijiang');
      // Deputy skills should NOT be unlocked yet.
      expect(p1.skills).not.toContain('longdan');
    });

    it('unlocks deputy skills when deputy is revealed', () => {
      kw.revealGeneral(game, p1, 'deputy', { main: mainGeneral, deputy: deputyGeneral });

      expect(p1.skills).toContain('longdan');
      expect(p1.skills).not.toContain('rende');
    });

    it('does not double-add skills on repeated reveal', () => {
      kw.revealGeneral(game, p1, 'main', { main: mainGeneral, deputy: deputyGeneral });
      kw.revealGeneral(game, p1, 'main', { main: mainGeneral, deputy: deputyGeneral });

      expect(p1.skills.filter(s => s === ('rende' as SkillId))).toHaveLength(1);
    });
  });

  describe('hidden generals have no active skills', () => {
    it('skills list is empty when both generals are hidden', () => {
      const main = makeGeneral({
        skills: ['rende' as SkillId, 'jijiang' as SkillId],
      });
      const deputy = makeGeneral({
        skills: ['longdan' as SkillId],
      });

      kw.assignGenerals(p1, main, deputy);

      expect(p1.skills).toEqual([]);
    });
  });

  describe('isFactionRevealed / getEffectiveFaction', () => {
    it('returns false and unknown when no general is revealed', () => {
      const main = makeGeneral({ faction: 'WEI' as Faction });
      const deputy = makeGeneral({ faction: 'WEI' as Faction });
      kw.assignGenerals(p1, main, deputy);

      expect(kw.isFactionRevealed(p1)).toBe(false);
      expect(kw.getEffectiveFaction(p1)).toBe('unknown');
    });

    it('returns true and faction after reveal', () => {
      const main = makeGeneral({ faction: 'WU' as Faction });
      const deputy = makeGeneral({ faction: 'WU' as Faction });
      kw.assignGenerals(p1, main, deputy);
      kw.revealGeneral(game, p1, 'main', { main, deputy });

      expect(kw.isFactionRevealed(p1)).toBe(true);
      expect(kw.getEffectiveFaction(p1)).toBe('WU');
    });
  });

  describe('areAllies', () => {
    it('detects allies when both players reveal the same faction', () => {
      const mainShu1 = makeGeneral({ id: 'liu_bei' as GeneralId, faction: 'SHU' as Faction });
      const deputyShu1 = makeGeneral({ id: 'guan_yu' as GeneralId, faction: 'SHU' as Faction });
      const mainShu2 = makeGeneral({ id: 'zhang_fei' as GeneralId, faction: 'SHU' as Faction });
      const deputyShu2 = makeGeneral({ id: 'zhao_yun' as GeneralId, faction: 'SHU' as Faction });

      kw.assignGenerals(p1, mainShu1, deputyShu1);
      kw.assignGenerals(p2, mainShu2, deputyShu2);
      kw.revealGeneral(game, p1, 'main', { main: mainShu1, deputy: deputyShu1 });
      kw.revealGeneral(game, p2, 'main', { main: mainShu2, deputy: deputyShu2 });

      expect(kw.areAllies(game, p1, p2)).toBe(true);
    });

    it('returns false for different revealed factions', () => {
      const mainShu = makeGeneral({ id: 'liu_bei' as GeneralId, faction: 'SHU' as Faction });
      const deputyShu = makeGeneral({ id: 'guan_yu' as GeneralId, faction: 'SHU' as Faction });
      const mainWei = makeGeneral({ id: 'cao_cao' as GeneralId, faction: 'WEI' as Faction });
      const deputyWei = makeGeneral({ id: 'sima_yi' as GeneralId, faction: 'WEI' as Faction });

      kw.assignGenerals(p1, mainShu, deputyShu);
      kw.assignGenerals(p2, mainWei, deputyWei);
      kw.revealGeneral(game, p1, 'main', { main: mainShu, deputy: deputyShu });
      kw.revealGeneral(game, p2, 'main', { main: mainWei, deputy: deputyWei });

      expect(kw.areAllies(game, p1, p2)).toBe(false);
    });

    it('returns false when one player has not revealed', () => {
      const mainShu = makeGeneral({ faction: 'SHU' as Faction });
      const deputyShu = makeGeneral({ faction: 'SHU' as Faction });

      kw.assignGenerals(p1, mainShu, deputyShu);
      kw.assignGenerals(p2, mainShu, deputyShu);
      kw.revealGeneral(game, p1, 'main', { main: mainShu, deputy: deputyShu });
      // p2 stays hidden

      expect(kw.areAllies(game, p1, p2)).toBe(false);
    });
  });

  describe('setupGame', () => {
    it('assigns generals to all players in the game', () => {
      const main1 = makeGeneral({ id: 'liu_bei' as GeneralId, faction: 'SHU' as Faction, hp: 4 });
      const dep1 = makeGeneral({ id: 'guan_yu' as GeneralId, faction: 'SHU' as Faction, hp: 3 });
      const main2 = makeGeneral({ id: 'cao_cao' as GeneralId, faction: 'WEI' as Faction, hp: 4 });
      const dep2 = makeGeneral({ id: 'sima_yi' as GeneralId, faction: 'WEI' as Faction, hp: 3 });

      kw.setupGame(game, [
        { playerId: p1.id, main: main1, deputy: dep1 },
        { playerId: p2.id, main: main2, deputy: dep2 },
      ]);

      expect(p1.mainGeneral!.generalId).toBe('liu_bei');
      expect(p1.deputyGeneral!.generalId).toBe('guan_yu');
      expect(p1.hp).toBe(4); // ceil(4/2)+ceil(3/2)
      expect(p2.mainGeneral!.generalId).toBe('cao_cao');
      expect(p2.deputyGeneral!.generalId).toBe('sima_yi');
      expect(p2.hp).toBe(4);
    });
  });
});
