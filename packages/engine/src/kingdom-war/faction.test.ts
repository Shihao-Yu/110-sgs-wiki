import { beforeEach, describe, expect, it } from 'vitest';
import type { Card, Faction, General, GeneralId, SkillId } from '@sgs/data';
import type { GameState } from '../state/game.js';
import type { PlayerState } from '../state/player.js';
import type { PlayerId } from '../state/types.js';
import { KingdomWarManager } from './kingdom-war-manager.js';
import { FactionManager } from './faction.js';

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

describe('FactionManager', () => {
  let kwManager: KingdomWarManager;
  let factionManager: FactionManager;
  let game: GameState;
  let p1: PlayerState;
  let p2: PlayerState;
  let p3: PlayerState;
  let p4: PlayerState;

  const weiMain = makeGeneral('caocao', 'WEI', 4, ['hujia']);
  const weiDeputy = makeGeneral('dianwei', 'WEI', 4, ['qiangxi']);
  const weiMain2 = makeGeneral('xunyu', 'WEI', 3, ['jieming']);
  const weiDeputy2 = makeGeneral('guojia', 'WEI', 3, ['tiandu']);
  const shuMain = makeGeneral('liubei', 'SHU', 4, ['jijiang']);
  const shuDeputy = makeGeneral('guanyu', 'SHU', 3, ['wusheng']);
  const wuMain = makeGeneral('sunquan', 'WU', 4, ['zhiheng']);
  const wuDeputy = makeGeneral('zhouyu', 'WU', 3, ['yingzi']);

  beforeEach(() => {
    kwManager = new KingdomWarManager();
    factionManager = new FactionManager(kwManager);
    p1 = makePlayer('p1', 0);
    p2 = makePlayer('p2', 1);
    p3 = makePlayer('p3', 2);
    p4 = makePlayer('p4', 3);
    game = makeGame([p1, p2, p3, p4]);
  });

  // ---------------------------------------------------------------
  // Victory: only WEI players alive
  // ---------------------------------------------------------------
  it('declares WEI victory when only revealed WEI players are alive', () => {
    kwManager.assignGenerals(p1, weiMain, weiDeputy);
    kwManager.assignGenerals(p2, weiMain2, weiDeputy2);
    kwManager.assignGenerals(p3, shuMain, shuDeputy);
    kwManager.assignGenerals(p4, wuMain, wuDeputy);

    // Reveal both WEI players
    kwManager.revealGeneral(game, p1, 'main');
    kwManager.revealGeneral(game, p2, 'main');

    // Kill non-WEI players
    p3.alive = false;
    p4.alive = false;

    expect(factionManager.checkVictoryCondition(game)).toBe('WEI');
  });

  // ---------------------------------------------------------------
  // No victory when multiple factions alive
  // ---------------------------------------------------------------
  it('returns null when multiple factions have alive players', () => {
    kwManager.assignGenerals(p1, weiMain, weiDeputy);
    kwManager.assignGenerals(p2, shuMain, shuDeputy);
    kwManager.assignGenerals(p3, wuMain, wuDeputy);
    kwManager.assignGenerals(p4, weiMain2, weiDeputy2);

    // Reveal all players
    kwManager.revealGeneral(game, p1, 'main');
    kwManager.revealGeneral(game, p2, 'main');
    kwManager.revealGeneral(game, p3, 'main');
    kwManager.revealGeneral(game, p4, 'main');

    expect(factionManager.checkVictoryCondition(game)).toBeNull();
  });

  // ---------------------------------------------------------------
  // Cross-faction targeting rules
  // ---------------------------------------------------------------
  it('allows hostile targeting between different factions', () => {
    kwManager.assignGenerals(p1, weiMain, weiDeputy);
    kwManager.assignGenerals(p2, shuMain, shuDeputy);

    kwManager.revealGeneral(game, p1, 'main');
    kwManager.revealGeneral(game, p2, 'main');

    // Different factions may target each other
    expect(factionManager.canTargetHostile(game, p1, p2)).toBe(true);
    expect(factionManager.canTargetHostile(game, p2, p1)).toBe(true);
  });

  it('blocks hostile targeting between allies of the same faction', () => {
    kwManager.assignGenerals(p1, weiMain, weiDeputy);
    kwManager.assignGenerals(p2, weiMain2, weiDeputy2);

    kwManager.revealGeneral(game, p1, 'main');
    kwManager.revealGeneral(game, p2, 'main');

    // Same faction allies cannot target each other
    expect(factionManager.canTargetHostile(game, p1, p2)).toBe(false);
    expect(factionManager.canTargetHostile(game, p2, p1)).toBe(false);
  });

  it('allows targeting when either player faction is unknown', () => {
    kwManager.assignGenerals(p1, weiMain, weiDeputy);
    kwManager.assignGenerals(p2, weiMain2, weiDeputy2);

    // Only p1 reveals — p2 is still hidden
    kwManager.revealGeneral(game, p1, 'main');

    // Hidden player can be targeted (unknown faction)
    expect(factionManager.canTargetHostile(game, p1, p2)).toBe(true);
  });

  // ---------------------------------------------------------------
  // Hidden players block faction victory
  // ---------------------------------------------------------------
  it('does not declare victory while hidden players remain alive', () => {
    kwManager.assignGenerals(p1, weiMain, weiDeputy);
    kwManager.assignGenerals(p2, weiMain2, weiDeputy2);
    kwManager.assignGenerals(p3, shuMain, shuDeputy);
    kwManager.assignGenerals(p4, wuMain, wuDeputy);

    // Kill non-WEI players
    p3.alive = false;
    p4.alive = false;

    // p1 reveals, p2 does NOT reveal — still hidden
    kwManager.revealGeneral(game, p1, 'main');

    // Hidden p2 blocks WEI victory even though they are WEI
    expect(factionManager.checkVictoryCondition(game)).toBeNull();

    // Now p2 reveals — WEI wins
    kwManager.revealGeneral(game, p2, 'main');
    expect(factionManager.checkVictoryCondition(game)).toBe('WEI');
  });

  // ---------------------------------------------------------------
  // Additional coverage: detectFactionAlliance and getFactionMembers
  // ---------------------------------------------------------------
  it('detectFactionAlliance returns unknown for unrevealed players', () => {
    kwManager.assignGenerals(p1, weiMain, weiDeputy);

    expect(factionManager.detectFactionAlliance(game, p1)).toBe('unknown');
  });

  it('detectFactionAlliance returns faction after reveal', () => {
    kwManager.assignGenerals(p1, weiMain, weiDeputy);
    kwManager.revealGeneral(game, p1, 'main');

    expect(factionManager.detectFactionAlliance(game, p1)).toBe('WEI');
  });

  it('getFactionMembers returns only alive revealed players of that faction', () => {
    kwManager.assignGenerals(p1, weiMain, weiDeputy);
    kwManager.assignGenerals(p2, weiMain2, weiDeputy2);
    kwManager.assignGenerals(p3, shuMain, shuDeputy);
    kwManager.assignGenerals(p4, wuMain, wuDeputy);

    kwManager.revealGeneral(game, p1, 'main');
    kwManager.revealGeneral(game, p2, 'main');
    kwManager.revealGeneral(game, p3, 'main');

    const weiMembers = factionManager.getFactionMembers(game, 'WEI');
    expect(weiMembers.map((p) => p.id)).toEqual(['p1', 'p2']);

    // Kill p2 — only p1 remains as WEI member
    p2.alive = false;
    const weiAfterDeath = factionManager.getFactionMembers(game, 'WEI');
    expect(weiAfterDeath.map((p) => p.id)).toEqual(['p1']);
  });

  it('returns null victory when all players are dead', () => {
    kwManager.assignGenerals(p1, weiMain, weiDeputy);
    p1.alive = false;
    p2.alive = false;
    p3.alive = false;
    p4.alive = false;

    expect(factionManager.checkVictoryCondition(game)).toBeNull();
  });

  it('returns null when all alive players are hidden', () => {
    kwManager.assignGenerals(p1, weiMain, weiDeputy);
    kwManager.assignGenerals(p2, weiMain2, weiDeputy2);
    p3.alive = false;
    p4.alive = false;

    // Both alive players are unrevealed
    expect(factionManager.checkVictoryCondition(game)).toBeNull();
  });
});
