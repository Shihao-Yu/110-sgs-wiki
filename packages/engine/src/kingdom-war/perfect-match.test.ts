import { beforeEach, describe, expect, it } from 'vitest';
import type { Card, Faction, General, GeneralId, SkillId } from '@sgs/data';
import type { GameState } from '../state/game.js';
import type { PlayerState } from '../state/player.js';
import type { PlayerId } from '../state/types.js';
import { KingdomWarManager } from './kingdom-war-manager.js';
import { PerfectMatchManager } from './perfect-match.js';

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

describe('PerfectMatchManager', () => {
  let kwManager: KingdomWarManager;
  let pmManager: PerfectMatchManager;
  let game: GameState;
  let p1: PlayerState;

  const liubei = makeGeneral('liubei', 'SHU', 4, ['jijiang']);
  const guanyu = makeGeneral('guanyu', 'SHU', 3, ['wusheng']);
  const zhangfei = makeGeneral('zhangfei', 'SHU', 4, ['paoxiao']);
  const caocao = makeGeneral('caocao', 'WEI', 4, ['hujia']);
  const xuchu = makeGeneral('xuchu', 'WEI', 4, ['luoyi']);
  const dianwei = makeGeneral('dianwei', 'WEI', 4, ['qiangxi']);
  const zhouyu = makeGeneral('zhouyu', 'WU', 3, ['yingzi']);
  const xiaoqiao = makeGeneral('xiaoqiao', 'WU', 3, ['tianxiang']);
  const lvbu = makeGeneral('lvbu', 'QUN', 4, ['wushuang']);
  const diaochan = makeGeneral('diaochan', 'QUN', 3, ['biyue']);

  beforeEach(() => {
    kwManager = new KingdomWarManager();
    pmManager = new PerfectMatchManager(kwManager);
    p1 = makePlayer('p1', 0);
    game = makeGame([p1]);
  });

  // ---------------------------------------------------------------
  // 1. Perfect match detection — positive case
  // ---------------------------------------------------------------
  it('detects a perfect match when both generals are revealed and form a pair', () => {
    kwManager.assignGenerals(p1, liubei, guanyu);
    kwManager.revealGeneral(game, p1, 'main');
    kwManager.revealGeneral(game, p1, 'deputy');

    expect(pmManager.checkPerfectMatch(p1)).toBe(true);
  });

  // ---------------------------------------------------------------
  // 2. Non-match returns false
  // ---------------------------------------------------------------
  it('returns false for generals that are not a canonical pair', () => {
    kwManager.assignGenerals(p1, liubei, dianwei);
    kwManager.revealGeneral(game, p1, 'main');
    kwManager.revealGeneral(game, p1, 'deputy');

    expect(pmManager.checkPerfectMatch(p1)).toBe(false);
  });

  // ---------------------------------------------------------------
  // 3. Bonus application — draw 2 cards
  // ---------------------------------------------------------------
  it('returns a draw-2 bonus for a valid perfect match', () => {
    kwManager.assignGenerals(p1, zhouyu, xiaoqiao);
    kwManager.revealGeneral(game, p1, 'main');
    kwManager.revealGeneral(game, p1, 'deputy');

    const bonus = pmManager.getPerfectMatchBonus(p1);

    expect(bonus).toEqual({ type: 'draw', amount: 2 });
  });

  // ---------------------------------------------------------------
  // 4. Unrevealed generals do not trigger perfect match
  // ---------------------------------------------------------------
  it('returns false when only one general is revealed', () => {
    kwManager.assignGenerals(p1, liubei, guanyu);
    kwManager.revealGeneral(game, p1, 'main');
    // deputy not revealed

    expect(pmManager.checkPerfectMatch(p1)).toBe(false);
  });

  it('returns false when neither general is revealed', () => {
    kwManager.assignGenerals(p1, liubei, guanyu);

    expect(pmManager.checkPerfectMatch(p1)).toBe(false);
  });

  // ---------------------------------------------------------------
  // 5. Bonus can only be claimed once
  // ---------------------------------------------------------------
  it('returns null bonus after the bonus has been claimed', () => {
    kwManager.assignGenerals(p1, caocao, xuchu);
    kwManager.revealGeneral(game, p1, 'main');
    kwManager.revealGeneral(game, p1, 'deputy');

    // First claim succeeds
    expect(pmManager.getPerfectMatchBonus(p1)).toEqual({ type: 'draw', amount: 2 });

    pmManager.claimBonus(p1);

    // Second claim returns null
    expect(pmManager.getPerfectMatchBonus(p1)).toBeNull();
  });

  // ---------------------------------------------------------------
  // 6. Pair order is irrelevant (symmetry)
  // ---------------------------------------------------------------
  it('detects perfect match regardless of which general is main vs deputy', () => {
    // guanyu as main, liubei as deputy (reversed)
    kwManager.assignGenerals(p1, guanyu, liubei);
    kwManager.revealGeneral(game, p1, 'main');
    kwManager.revealGeneral(game, p1, 'deputy');

    expect(pmManager.checkPerfectMatch(p1)).toBe(true);
  });

  // ---------------------------------------------------------------
  // 7. Multiple official pairs are registered
  // ---------------------------------------------------------------
  it('registers at least 15 canonical pairs', () => {
    const pairs = pmManager.getAllPairs();

    expect(pairs.length).toBeGreaterThanOrEqual(15);
  });

  // ---------------------------------------------------------------
  // 8. Cross-faction pair works (e.g. 吕布 + 貂蝉)
  // ---------------------------------------------------------------
  it('detects cross-faction pair like 吕布 + 貂蝉', () => {
    kwManager.assignGenerals(p1, lvbu, diaochan);
    kwManager.revealGeneral(game, p1, 'main');
    kwManager.revealGeneral(game, p1, 'deputy');

    expect(pmManager.checkPerfectMatch(p1)).toBe(true);
    expect(pmManager.getPerfectMatchBonus(p1)).toEqual({ type: 'draw', amount: 2 });
  });

  // ---------------------------------------------------------------
  // 9. 桃园三结义: all three pairings among 刘备/关羽/张飞
  // ---------------------------------------------------------------
  it('recognises all three pairings of 刘备, 关羽, 张飞', () => {
    expect(pmManager.isPair('liubei' as GeneralId, 'guanyu' as GeneralId)).toBe(true);
    expect(pmManager.isPair('liubei' as GeneralId, 'zhangfei' as GeneralId)).toBe(true);
    expect(pmManager.isPair('guanyu' as GeneralId, 'zhangfei' as GeneralId)).toBe(true);
  });

  // ---------------------------------------------------------------
  // 10. Non-match bonus returns null
  // ---------------------------------------------------------------
  it('returns null bonus for non-matching generals', () => {
    kwManager.assignGenerals(p1, liubei, dianwei);
    kwManager.revealGeneral(game, p1, 'main');
    kwManager.revealGeneral(game, p1, 'deputy');

    expect(pmManager.getPerfectMatchBonus(p1)).toBeNull();
  });
});
