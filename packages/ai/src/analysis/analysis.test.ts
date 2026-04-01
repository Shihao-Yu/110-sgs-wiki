import { describe, it, expect } from 'vitest';
import type { GeneralSimStats, SimulationResult } from '../simulation/index.js';
import type { General, GeneralId, Skill, SkillId } from '@sgs/data';
import { WinRateCalculator } from './winrate.js';
import { MultiDimensionalScorer } from './scoring.js';
import { FactorAnalyzer } from './factors.js';
import { GeneralEvaluator } from '../strategy/evaluator.js';

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

function makeGeneralStats(
  overrides: Partial<GeneralSimStats> = {},
): GeneralSimStats {
  return {
    gamesPlayed: 10,
    wins: 3,
    winRate: 30,
    avgSurvivalTurns: 8,
    avgDamageDealt: 4,
    avgDamageReceived: 3,
    avgCardsDrawn: 12,
    ...overrides,
  };
}

function makeSimResult(
  overrides: Partial<SimulationResult> = {},
): SimulationResult {
  const generalStats =
    overrides.generalStats ??
    new Map<string, GeneralSimStats>([
      ['caocao', makeGeneralStats({ wins: 6, winRate: 60, gamesPlayed: 10 })],
      ['liubei', makeGeneralStats({ wins: 4, winRate: 40, gamesPlayed: 10 })],
      ['sunquan', makeGeneralStats({ wins: 5, winRate: 50, gamesPlayed: 10 })],
      ['lvbu', makeGeneralStats({ wins: 2, winRate: 20, gamesPlayed: 10 })],
    ]);

  return {
    totalGames: overrides.totalGames ?? 10,
    factionWinRates: overrides.factionWinRates ?? {
      WEI: 40,
      SHU: 20,
      WU: 30,
      QUN: 10,
    },
    generalStats,
    averageTurns: overrides.averageTurns ?? 15,
    duration: overrides.duration ?? 500,
  };
}

function makeSkill(
  id: string,
  description: string,
): Skill {
  return {
    id: id as SkillId,
    name: id,
    description,
    type: 'passive',
    timing: [],
    generalIds: [],
    faq: [],
  };
}

function makeGeneral(
  id: string,
  skillIds: string[],
  overrides: Partial<General> = {},
): General {
  return {
    id: id as GeneralId,
    name: id,
    title: '',
    faction: 'WEI',
    hp: 4,
    maxHp: 4,
    gender: 'male',
    skills: skillIds as SkillId[],
    image: '',
    pack: 'test',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// WinRateCalculator
// ---------------------------------------------------------------------------

describe('WinRateCalculator', () => {
  const calc = new WinRateCalculator();

  describe('rankGenerals — sorts by win rate descending', () => {
    it('produces a correctly ordered leaderboard', () => {
      const sim = makeSimResult();
      const stats = calc.computeWinRates(sim);
      const ranked = calc.rankGenerals(stats);

      expect(ranked).toHaveLength(4);

      // Verify descending win rate order
      expect(ranked[0]!.generalId).toBe('caocao');  // 60%
      expect(ranked[1]!.generalId).toBe('sunquan'); // 50%
      expect(ranked[2]!.generalId).toBe('liubei');  // 40%
      expect(ranked[3]!.generalId).toBe('lvbu');    // 20%

      // Verify 1-based ranks
      expect(ranked[0]!.rank).toBe(1);
      expect(ranked[3]!.rank).toBe(4);

      // Verify data integrity
      expect(ranked[0]!.winRate).toBe(60);
      expect(ranked[0]!.wins).toBe(6);
      expect(ranked[0]!.gamesPlayed).toBe(10);
    });
  });

  describe('getTopGenerals — returns correct slice', () => {
    it('returns top N generals', () => {
      const sim = makeSimResult();
      const stats = calc.computeWinRates(sim);

      const top2 = calc.getTopGenerals(stats, 2);
      expect(top2).toHaveLength(2);
      expect(top2[0]!.generalId).toBe('caocao');
      expect(top2[1]!.generalId).toBe('sunquan');
    });

    it('returns all when N exceeds total generals', () => {
      const sim = makeSimResult();
      const stats = calc.computeWinRates(sim);

      const top100 = calc.getTopGenerals(stats, 100);
      expect(top100).toHaveLength(4);
    });

    it('defaults to 5 when no N provided', () => {
      // Create a sim with 7 generals
      const bigStats = new Map<string, GeneralSimStats>([
        ['a', makeGeneralStats({ winRate: 70 })],
        ['b', makeGeneralStats({ winRate: 60 })],
        ['c', makeGeneralStats({ winRate: 50 })],
        ['d', makeGeneralStats({ winRate: 40 })],
        ['e', makeGeneralStats({ winRate: 30 })],
        ['f', makeGeneralStats({ winRate: 20 })],
        ['g', makeGeneralStats({ winRate: 10 })],
      ]);

      const top = calc.getTopGenerals(bigStats);
      expect(top).toHaveLength(5);
    });
  });

  describe('rankGenerals — tie-breaking', () => {
    it('breaks win rate ties by total wins', () => {
      const stats = new Map<string, GeneralSimStats>([
        ['alpha', makeGeneralStats({ winRate: 50, wins: 10, gamesPlayed: 20 })],
        ['beta', makeGeneralStats({ winRate: 50, wins: 5, gamesPlayed: 10 })],
      ]);

      const ranked = calc.rankGenerals(stats);
      expect(ranked[0]!.generalId).toBe('alpha');
      expect(ranked[1]!.generalId).toBe('beta');
    });
  });
});

// ---------------------------------------------------------------------------
// MultiDimensionalScorer
// ---------------------------------------------------------------------------

describe('MultiDimensionalScorer', () => {
  // Skills that clearly indicate dimensions
  const drawSkill = makeSkill('sk_draw', '摸两张牌，获得额外手牌。');
  const controlSkill = makeSkill('sk_ctrl', '弃置目标一张牌，令其不能使用。');
  const burstSkill = makeSkill('sk_burst', '造成1点伤害，对目标杀。');
  const defenseSkill = makeSkill('sk_def', '使用闪，回复1点体力，防止伤害。');

  const genDraw = makeGeneral('gen_draw', ['sk_draw'], { hp: 3, maxHp: 3 });
  const genCtrl = makeGeneral('gen_ctrl', ['sk_ctrl']);
  const genBurst = makeGeneral('gen_burst', ['sk_burst']);
  const genDef = makeGeneral('gen_def', ['sk_def']);

  const evaluator = new GeneralEvaluator(
    [genDraw, genCtrl, genBurst, genDef],
    [drawSkill, controlSkill, burstSkill, defenseSkill],
  );
  const scorer = new MultiDimensionalScorer(evaluator);

  describe('scoreGeneral — produces valid scores', () => {
    it('scores a draw-focused general with high draw dimension', () => {
      const result = scorer.scoreGeneral('gen_draw');
      expect(result).not.toBeNull();
      expect(result!.scores.draw).toBeGreaterThan(0);
      // draw should be the dominant score
      expect(result!.scores.draw).toBeGreaterThanOrEqual(result!.scores.burst);
    });

    it('returns null for unknown general', () => {
      const result = scorer.scoreGeneral('nonexistent');
      expect(result).toBeNull();
    });

    it('all scores are in 0-10 range', () => {
      const result = scorer.scoreGeneral('gen_ctrl');
      expect(result).not.toBeNull();
      const { draw, control, burst, defense } = result!.scores;
      for (const v of [draw, control, burst, defense]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(10);
      }
    });
  });

  describe('compareGenerals — radar chart output', () => {
    it('produces correctly shaped radar chart data', () => {
      const data = scorer.compareGenerals([
        'gen_draw',
        'gen_ctrl',
        'gen_burst',
        'gen_def',
      ]);

      expect(data.dimensions).toEqual(['draw', 'control', 'burst', 'defense']);
      expect(data.values).toHaveLength(4);
      expect(data.labels).toHaveLength(4);
      expect(data.labels).toContain('gen_draw');
      expect(data.labels).toContain('gen_ctrl');

      // Each value row has 4 dimensions
      for (const row of data.values) {
        expect(row).toHaveLength(4);
        for (const v of row) {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(10);
        }
      }
    });

    it('omits unknown generals without error', () => {
      const data = scorer.compareGenerals(['gen_draw', 'unknown_gen']);
      expect(data.values).toHaveLength(1);
      expect(data.labels).toEqual(['gen_draw']);
    });

    it('returns empty data for all-unknown input', () => {
      const data = scorer.compareGenerals(['x', 'y']);
      expect(data.values).toHaveLength(0);
      expect(data.labels).toHaveLength(0);
      expect(data.dimensions).toEqual(['draw', 'control', 'burst', 'defense']);
    });
  });
});

// ---------------------------------------------------------------------------
// FactorAnalyzer
// ---------------------------------------------------------------------------

describe('FactorAnalyzer', () => {
  const analyzer = new FactorAnalyzer();

  describe('analyzeFactionBalance — faction win rate distribution', () => {
    it('computes faction win rates from simulation results', () => {
      const sim = makeSimResult({
        totalGames: 100,
        factionWinRates: { WEI: 40, SHU: 25, WU: 25, QUN: 10 },
      });

      const balance = analyzer.analyzeFactionBalance([sim]);

      expect(balance).toHaveLength(4);

      // Sorted by win rate descending
      expect(balance[0]!.faction).toBe('WEI');
      expect(balance[0]!.winRate).toBeCloseTo(40, 0);
      expect(balance[0]!.wins).toBe(40);
      expect(balance[0]!.totalGames).toBe(100);
    });

    it('merges multiple simulation runs', () => {
      const sim1 = makeSimResult({
        totalGames: 100,
        factionWinRates: { WEI: 60, SHU: 40 },
      });
      const sim2 = makeSimResult({
        totalGames: 100,
        factionWinRates: { WEI: 40, SHU: 60 },
      });

      const balance = analyzer.analyzeFactionBalance([sim1, sim2]);

      const wei = balance.find((b) => b.faction === 'WEI')!;
      const shu = balance.find((b) => b.faction === 'SHU')!;

      // 60 + 40 wins out of 200 total games each
      expect(wei.totalGames).toBe(200);
      expect(wei.wins).toBe(100);
      expect(wei.winRate).toBeCloseTo(50, 0);
      expect(shu.winRate).toBeCloseTo(50, 0);
    });
  });

  describe('analyzePairings — dual-general pair analysis', () => {
    it('produces pairing stats sorted by win rate', () => {
      const sim = makeSimResult();
      const pairings = analyzer.analyzePairings([sim]);

      expect(pairings.length).toBeGreaterThan(0);

      // Verify sorted descending
      for (let i = 1; i < pairings.length; i++) {
        expect(pairings[i]!.winRate).toBeLessThanOrEqual(
          pairings[i - 1]!.winRate,
        );
      }

      // Each pairing has alphabetically ordered ids
      for (const p of pairings) {
        expect(p.generalA < p.generalB).toBe(true);
        expect(p.gamesPlayed).toBeGreaterThan(0);
        expect(p.winRate).toBeGreaterThanOrEqual(0);
        expect(p.winRate).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('analyzePositionEffect — seat position impact', () => {
    it('produces one entry per seat position', () => {
      const sim = makeSimResult();
      const positions = analyzer.analyzePositionEffect([sim], 4);

      expect(positions).toHaveLength(4);

      for (const pos of positions) {
        expect(pos.seat).toBeGreaterThanOrEqual(0);
        expect(pos.seat).toBeLessThan(4);
        expect(pos.winRate).toBeGreaterThanOrEqual(0);
        expect(pos.winRate).toBeLessThanOrEqual(100);
      }
    });

    it('supports 8-player seat analysis', () => {
      const positions = analyzer.analyzePositionEffect([], 8);
      expect(positions).toHaveLength(8);
      // All zeros when no data
      for (const pos of positions) {
        expect(pos.gamesPlayed).toBe(0);
        expect(pos.winRate).toBe(0);
      }
    });
  });
});
