import { beforeEach, describe, expect, it } from 'vitest';
import type { Card, Faction, General, GeneralId, SkillId } from '@sgs/data';
import type { GameState } from '../state/game.js';
import type { PlayerState } from '../state/player.js';
import type { PlayerId } from '../state/types.js';
import { KingdomWarManager } from './kingdom-war-manager.js';

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
    currentPlayerIndex: 1,
    currentPhase: 'play',
    turnCount: 3,
    activeEffects: [],
    gameOver: true,
    winnerFaction: 'WEI' as Faction,
  };
}

function makeGeneral(
  id: string,
  faction: Faction,
  hp: number,
  skillNames: string[],
): General {
  return {
    id: id as GeneralId,
    name: id,
    title: `${id} title`,
    faction,
    hp,
    maxHp: hp,
    gender: 'male',
    skills: skillNames.map(skill => skill as SkillId),
    image: `${id}.png`,
    pack: '国战',
  };
}

describe('KingdomWarManager', () => {
  let manager: KingdomWarManager;
  let game: GameState;
  let p1: PlayerState;
  let p2: PlayerState;
  let shuMain: General;
  let shuDeputy: General;
  let weiMain: General;
  let weiDeputy: General;

  beforeEach(() => {
    manager = new KingdomWarManager();
    p1 = makePlayer('p1', 0);
    p2 = makePlayer('p2', 1);
    game = makeGame([p1, p2]);
    shuMain = makeGeneral('liubei', 'SHU', 4, ['jijiang']);
    shuDeputy = makeGeneral('guanyu', 'SHU', 3, ['wusheng']);
    weiMain = makeGeneral('caocao', 'WEI', 4, ['hujia']);
    weiDeputy = makeGeneral('dianwei', 'WEI', 4, ['qiangxi']);
  });

  it('calculates dual HP as ceil(hp1 / 2) + ceil(hp2 / 2)', () => {
    expect(manager.calculateDualHp(shuMain, shuDeputy)).toBe(4);
  });

  it('setupGame assigns hidden main/deputy generals and resets core state', () => {
    manager.setupGame(
      game,
      new Map<string, [General, General]>([
        [p1.id, [shuMain, shuDeputy]],
        [p2.id, [weiMain, weiDeputy]],
      ]),
    );

    expect(p1.mainGeneral).toEqual({
      generalId: shuMain.id,
      revealed: false,
    });
    expect(p1.deputyGeneral).toEqual({
      generalId: shuDeputy.id,
      revealed: false,
    });
    expect(p1.hp).toBe(4);
    expect(p1.maxHp).toBe(4);
    expect(p1.faction).toBeNull();
    expect(p1.skills).toEqual([]);
    expect(game.currentPlayerIndex).toBe(0);
    expect(game.currentPhase).toBe('prepare');
    expect(game.turnCount).toBe(1);
    expect(game.gameOver).toBe(false);
    expect(game.winnerFaction).toBeNull();
  });

  it('revealing a general reveals the faction and activates only that slot skills', () => {
    manager.assignGenerals(p1, shuMain, shuDeputy);

    manager.revealGeneral(game, p1, 'deputy');

    expect(p1.deputyGeneral?.revealed).toBe(true);
    expect(manager.isFactionRevealed(p1)).toBe(true);
    expect(manager.getEffectiveFaction(p1)).toBe('SHU');
    expect(p1.skills).toEqual(['wusheng' as SkillId]);
  });

  it('hidden generals do not provide usable skills until revealed', () => {
    manager.assignGenerals(p1, shuMain, shuDeputy);

    expect(manager.canUseSkill(p1, 'jijiang' as SkillId)).toBe(false);
    expect(manager.canUseSkill(p1, 'wusheng' as SkillId)).toBe(false);
  });

  it('first skill use auto-reveals the owning general', () => {
    manager.assignGenerals(p1, shuMain, shuDeputy);

    const used = manager.useSkill(game, p1, 'main', 'jijiang' as SkillId);

    expect(used).toBe(true);
    expect(p1.mainGeneral?.revealed).toBe(true);
    expect(p1.faction).toBe('SHU');
    expect(p1.skills).toContain('jijiang' as SkillId);
  });

  it('detects allies only after both players have matching revealed factions', () => {
    manager.assignGenerals(p1, shuMain, shuDeputy);
    manager.assignGenerals(p2, makeGeneral('zhangfei', 'SHU', 4, ['paoxiao']), shuDeputy);

    expect(manager.areAllies(game, p1, p2)).toBe(false);

    manager.revealGeneral(game, p1, 'main');
    manager.revealGeneral(game, p2, 'deputy');

    expect(manager.areAllies(game, p1, p2)).toBe(true);
  });

  it('promotes the deputy when the main general dies', () => {
    manager.assignGenerals(p1, shuMain, shuDeputy);
    manager.revealGeneral(game, p1, 'deputy');
    p1.hp = 4;

    manager.handleGeneralDeath(p1, 'main');

    expect(p1.mainGeneral).toEqual({
      generalId: shuDeputy.id,
      revealed: true,
    });
    expect(p1.deputyGeneral).toBeNull();
    expect(p1.maxHp).toBe(2);
    expect(p1.hp).toBe(2);
    expect(p1.skills).toEqual(['wusheng' as SkillId]);
  });

  it('removing the deputy drops deputy skills and recalculates HP', () => {
    manager.assignGenerals(p1, shuMain, shuDeputy);
    manager.revealGeneral(game, p1, 'main');
    manager.revealGeneral(game, p1, 'deputy');
    p1.hp = 4;

    manager.handleGeneralDeath(p1, 'deputy');

    expect(p1.deputyGeneral).toBeNull();
    expect(p1.maxHp).toBe(2);
    expect(p1.hp).toBe(2);
    expect(p1.skills).toEqual(['jijiang' as SkillId]);
  });
});
