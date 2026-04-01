import { describe, it, expect } from 'vitest';
import type { GeneralSimStats, SimulationResult } from '../simulation/index.js';
import type { General, GeneralId, Skill, SkillId } from '@sgs/data';
import { WinRateCalculator } from './winrate.js';
import { MultiDimensionalScorer } from './scoring.js';
import { FactorAnalyzer } from './factors.js';
import { AnalysisReportGenerator } from './report.js';
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
// FactorAnalyzer — Basic Methods (existing)
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

// ---------------------------------------------------------------------------
// FactorAnalyzer — Skill Impact
// ---------------------------------------------------------------------------

describe('FactorAnalyzer — analyzeSkillImpact', () => {
  const skillA = makeSkill('sk_a', '摸两张牌');
  const skillB = makeSkill('sk_b', '造成伤害');

  const genA = makeGeneral('gen_a', ['sk_a'], { hp: 3, maxHp: 3 });
  const genB = makeGeneral('gen_b', ['sk_b'], { hp: 4, maxHp: 4 });
  const genC = makeGeneral('gen_c', ['sk_a', 'sk_b'], { hp: 4, maxHp: 4 });

  it('returns empty when no generals/skills provided', () => {
    const analyzer = new FactorAnalyzer();
    const sim = makeSimResult();
    expect(analyzer.analyzeSkillImpact([sim])).toEqual([]);
  });

  it('isolates skill impact across generals', () => {
    const analyzer = new FactorAnalyzer(
      [genA, genB, genC],
      [skillA, skillB],
    );

    const sim = makeSimResult({
      totalGames: 30,
      generalStats: new Map([
        ['gen_a', makeGeneralStats({ gamesPlayed: 10, wins: 7, winRate: 70 })],
        ['gen_b', makeGeneralStats({ gamesPlayed: 10, wins: 3, winRate: 30 })],
        ['gen_c', makeGeneralStats({ gamesPlayed: 10, wins: 5, winRate: 50 })],
      ]),
    });

    const impact = analyzer.analyzeSkillImpact([sim]);

    expect(impact).toHaveLength(2);

    // sk_a is on gen_a (70%) and gen_c (50%) -> 12/20 = 60%
    const skA = impact.find((s) => s.skillId === 'sk_a')!;
    expect(skA).toBeDefined();
    expect(skA.generalsWithSkill).toBe(2);
    expect(skA.gamesPlayed).toBe(20);
    expect(skA.wins).toBe(12);
    expect(skA.winRate).toBeCloseTo(60, 0);

    // sk_b is on gen_b (30%) and gen_c (50%) -> 8/20 = 40%
    const skB = impact.find((s) => s.skillId === 'sk_b')!;
    expect(skB).toBeDefined();
    expect(skB.generalsWithSkill).toBe(2);
    expect(skB.gamesPlayed).toBe(20);
    expect(skB.wins).toBe(8);
    expect(skB.winRate).toBeCloseTo(40, 0);

    // Sorted by winRateDelta descending: sk_a should come first
    expect(impact[0]!.skillId).toBe('sk_a');
  });

  it('computes winRateDelta relative to overall average', () => {
    const analyzer = new FactorAnalyzer(
      [genA, genB],
      [skillA, skillB],
    );

    const sim = makeSimResult({
      totalGames: 20,
      generalStats: new Map([
        ['gen_a', makeGeneralStats({ gamesPlayed: 10, wins: 8, winRate: 80 })],
        ['gen_b', makeGeneralStats({ gamesPlayed: 10, wins: 2, winRate: 20 })],
      ]),
    });

    const impact = analyzer.analyzeSkillImpact([sim]);

    // Overall: 10/20 = 50%
    // sk_a: 80% -> delta = +30
    // sk_b: 20% -> delta = -30
    const skA = impact.find((s) => s.skillId === 'sk_a')!;
    const skB = impact.find((s) => s.skillId === 'sk_b')!;

    expect(skA.winRateDelta).toBeCloseTo(30, 0);
    expect(skB.winRateDelta).toBeCloseTo(-30, 0);
  });

  it('handles generals not present in simulation results', () => {
    const analyzer = new FactorAnalyzer(
      [genA, genB, genC],
      [skillA, skillB],
    );

    // Only gen_a appears in the sim
    const sim = makeSimResult({
      totalGames: 10,
      generalStats: new Map([
        ['gen_a', makeGeneralStats({ gamesPlayed: 10, wins: 5, winRate: 50 })],
      ]),
    });

    const impact = analyzer.analyzeSkillImpact([sim]);

    // sk_a appears (gen_a has it), sk_b also appears (gen_c has it, but
    // gen_c is not in sim, so its games/wins = 0; gen_b also not in sim)
    const skA = impact.find((s) => s.skillId === 'sk_a')!;
    expect(skA.gamesPlayed).toBe(10);  // only gen_a contributes
    expect(skA.wins).toBe(5);

    const skB = impact.find((s) => s.skillId === 'sk_b')!;
    expect(skB.gamesPlayed).toBe(0);
    expect(skB.winRate).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// FactorAnalyzer — HP Correlation
// ---------------------------------------------------------------------------

describe('FactorAnalyzer — analyzeHpCorrelation', () => {
  const gen3hp = makeGeneral('gen_3hp', [], { hp: 3, maxHp: 3 });
  const gen4hp_a = makeGeneral('gen_4hp_a', [], { hp: 4, maxHp: 4 });
  const gen4hp_b = makeGeneral('gen_4hp_b', [], { hp: 4, maxHp: 4 });
  const gen5hp = makeGeneral('gen_5hp', [], { hp: 5, maxHp: 5 });

  it('returns empty when no generals provided', () => {
    const analyzer = new FactorAnalyzer();
    const sim = makeSimResult();
    expect(analyzer.analyzeHpCorrelation([sim])).toEqual([]);
  });

  it('groups generals by HP and computes win rates', () => {
    const analyzer = new FactorAnalyzer(
      [gen3hp, gen4hp_a, gen4hp_b, gen5hp],
      [],
    );

    const sim = makeSimResult({
      totalGames: 40,
      generalStats: new Map([
        ['gen_3hp', makeGeneralStats({ gamesPlayed: 10, wins: 2, winRate: 20 })],
        ['gen_4hp_a', makeGeneralStats({ gamesPlayed: 10, wins: 5, winRate: 50 })],
        ['gen_4hp_b', makeGeneralStats({ gamesPlayed: 10, wins: 6, winRate: 60 })],
        ['gen_5hp', makeGeneralStats({ gamesPlayed: 10, wins: 8, winRate: 80 })],
      ]),
    });

    const correlation = analyzer.analyzeHpCorrelation([sim]);

    expect(correlation).toHaveLength(3);  // HP buckets: 3, 4, 5

    // Sorted by HP ascending
    expect(correlation[0]!.hp).toBe(3);
    expect(correlation[1]!.hp).toBe(4);
    expect(correlation[2]!.hp).toBe(5);

    // HP 3: gen_3hp only -> 2/10 = 20%
    expect(correlation[0]!.generalCount).toBe(1);
    expect(correlation[0]!.gamesPlayed).toBe(10);
    expect(correlation[0]!.wins).toBe(2);
    expect(correlation[0]!.winRate).toBeCloseTo(20, 0);

    // HP 4: gen_4hp_a + gen_4hp_b -> (5+6)/(10+10) = 55%
    expect(correlation[1]!.generalCount).toBe(2);
    expect(correlation[1]!.gamesPlayed).toBe(20);
    expect(correlation[1]!.wins).toBe(11);
    expect(correlation[1]!.winRate).toBeCloseTo(55, 0);

    // HP 5: gen_5hp -> 8/10 = 80%
    expect(correlation[2]!.generalCount).toBe(1);
    expect(correlation[2]!.winRate).toBeCloseTo(80, 0);
  });

  it('produces valid data with no matching sim results', () => {
    const analyzer = new FactorAnalyzer([gen3hp], []);

    const sim = makeSimResult({
      totalGames: 10,
      generalStats: new Map([
        // gen_3hp not present
        ['other_gen', makeGeneralStats({ gamesPlayed: 10, wins: 5, winRate: 50 })],
      ]),
    });

    const correlation = analyzer.analyzeHpCorrelation([sim]);
    expect(correlation).toHaveLength(1);
    expect(correlation[0]!.hp).toBe(3);
    expect(correlation[0]!.gamesPlayed).toBe(0);
    expect(correlation[0]!.winRate).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// FactorAnalyzer — generateReport
// ---------------------------------------------------------------------------

describe('FactorAnalyzer — generateReport', () => {
  const skillA = makeSkill('sk_a', '摸牌');
  const genA = makeGeneral('gen_a', ['sk_a'], { hp: 4, maxHp: 4 });
  const genB = makeGeneral('gen_b', [], { hp: 3, maxHp: 3 });

  it('generates a comprehensive report with all sections', () => {
    const analyzer = new FactorAnalyzer([genA, genB], [skillA]);

    const sim = makeSimResult({
      totalGames: 20,
      factionWinRates: { WEI: 50, SHU: 50 },
      generalStats: new Map([
        ['gen_a', makeGeneralStats({ gamesPlayed: 10, wins: 6, winRate: 60 })],
        ['gen_b', makeGeneralStats({ gamesPlayed: 10, wins: 4, winRate: 40 })],
      ]),
    });

    const report = analyzer.generateReport([sim], 4);

    // All sections present
    expect(report.pairings).toBeDefined();
    expect(report.factionBalance).toBeDefined();
    expect(report.positionEffect).toBeDefined();
    expect(report.skillImpact).toBeDefined();
    expect(report.hpCorrelation).toBeDefined();
    expect(report.meta).toBeDefined();

    // Position effect has correct seat count
    expect(report.positionEffect).toHaveLength(4);

    // Skill impact has data
    expect(report.skillImpact.length).toBeGreaterThan(0);

    // HP correlation has data
    expect(report.hpCorrelation.length).toBeGreaterThan(0);

    // Meta
    expect(report.meta.totalSimulations).toBe(1);
    expect(report.meta.totalGames).toBe(20);
    expect(report.meta.generatedAt).toBeTruthy();
  });

  it('handles empty simulation input', () => {
    const analyzer = new FactorAnalyzer([genA], [skillA]);
    const report = analyzer.generateReport([], 4);

    expect(report.pairings).toEqual([]);
    expect(report.factionBalance).toEqual([]);
    expect(report.positionEffect).toHaveLength(4);
    expect(report.meta.totalGames).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// AnalysisReportGenerator
// ---------------------------------------------------------------------------

describe('AnalysisReportGenerator', () => {
  const skillDraw = makeSkill('sk_draw', '摸两张牌');
  const skillBurst = makeSkill('sk_burst', '造成伤害');

  const genA = makeGeneral('gen_a', ['sk_draw'], { hp: 3, maxHp: 3 });
  const genB = makeGeneral('gen_b', ['sk_burst'], { hp: 4, maxHp: 4 });

  it('generates a complete report with all sections', () => {
    const generator = new AnalysisReportGenerator(
      [genA, genB],
      [skillDraw, skillBurst],
      4,
    );

    const sim = makeSimResult({
      totalGames: 20,
      factionWinRates: { WEI: 60, SHU: 40 },
      generalStats: new Map([
        ['gen_a', makeGeneralStats({ gamesPlayed: 10, wins: 7, winRate: 70 })],
        ['gen_b', makeGeneralStats({ gamesPlayed: 10, wins: 3, winRate: 30 })],
      ]),
    });

    const report = generator.generate([sim]);

    // Leaderboard
    expect(report.leaderboard).toHaveLength(2);
    expect(report.leaderboard[0]!.generalId).toBe('gen_a');
    expect(report.leaderboard[0]!.rank).toBe(1);
    expect(report.leaderboard[1]!.generalId).toBe('gen_b');

    // Radar chart
    expect(report.radarChart.dimensions).toEqual([
      'draw', 'control', 'burst', 'defense',
    ]);
    // Only generals found in evaluator will appear (gen_a, gen_b)
    expect(report.radarChart.labels.length).toBeLessThanOrEqual(2);

    // Factors
    expect(report.factors.factionBalance).toBeDefined();
    expect(report.factors.skillImpact).toBeDefined();
    expect(report.factors.hpCorrelation).toBeDefined();
    expect(report.factors.pairings).toBeDefined();
    expect(report.factors.positionEffect).toBeDefined();

    // Meta
    expect(report.meta.totalSimulations).toBe(1);
    expect(report.meta.totalGames).toBe(20);
    expect(report.meta.generalCount).toBe(2);
    expect(report.meta.playerCount).toBe(4);
    expect(report.meta.generatedAt).toBeTruthy();
  });

  it('returns an empty report when given no simulations', () => {
    const generator = new AnalysisReportGenerator(
      [genA, genB],
      [skillDraw, skillBurst],
    );

    const report = generator.generate([]);

    expect(report.leaderboard).toEqual([]);
    expect(report.radarChart.values).toEqual([]);
    expect(report.radarChart.labels).toEqual([]);
    expect(report.factors.pairings).toEqual([]);
    expect(report.meta.totalGames).toBe(0);
    expect(report.meta.totalSimulations).toBe(0);
  });

  it('merges stats across multiple simulation results', () => {
    const generator = new AnalysisReportGenerator(
      [genA, genB],
      [skillDraw, skillBurst],
    );

    const sim1 = makeSimResult({
      totalGames: 10,
      factionWinRates: { WEI: 60 },
      generalStats: new Map([
        ['gen_a', makeGeneralStats({ gamesPlayed: 10, wins: 6, winRate: 60 })],
      ]),
    });
    const sim2 = makeSimResult({
      totalGames: 10,
      factionWinRates: { WEI: 40 },
      generalStats: new Map([
        ['gen_a', makeGeneralStats({ gamesPlayed: 10, wins: 4, winRate: 40 })],
      ]),
    });

    const report = generator.generate([sim1, sim2]);

    // Merged: gen_a played 20 games, won 10 -> 50%
    expect(report.leaderboard).toHaveLength(1);
    expect(report.leaderboard[0]!.gamesPlayed).toBe(20);
    expect(report.leaderboard[0]!.wins).toBe(10);
    expect(report.leaderboard[0]!.winRate).toBeCloseTo(50, 0);

    expect(report.meta.totalGames).toBe(20);
    expect(report.meta.totalSimulations).toBe(2);
  });

  describe('toJSON — serialisation', () => {
    it('produces valid JSON', () => {
      const generator = new AnalysisReportGenerator(
        [genA],
        [skillDraw],
      );

      const sim = makeSimResult({
        totalGames: 10,
        generalStats: new Map([
          ['gen_a', makeGeneralStats({ gamesPlayed: 10, wins: 5, winRate: 50 })],
        ]),
      });

      const report = generator.generate([sim]);
      const json = AnalysisReportGenerator.toJSON(report);

      // Verify it parses back correctly
      const parsed = JSON.parse(json);
      expect(parsed.leaderboard).toBeDefined();
      expect(parsed.radarChart).toBeDefined();
      expect(parsed.factors).toBeDefined();
      expect(parsed.meta).toBeDefined();
      expect(parsed.meta.totalGames).toBe(10);
    });

    it('cross-tabulation output contains all factor sections', () => {
      const generator = new AnalysisReportGenerator(
        [genA, genB],
        [skillDraw, skillBurst],
      );

      const sim = makeSimResult({
        totalGames: 20,
        factionWinRates: { WEI: 50, SHU: 50 },
        generalStats: new Map([
          ['gen_a', makeGeneralStats({ gamesPlayed: 10, wins: 6, winRate: 60 })],
          ['gen_b', makeGeneralStats({ gamesPlayed: 10, wins: 4, winRate: 40 })],
        ]),
      });

      const report = generator.generate([sim]);
      const json = AnalysisReportGenerator.toJSON(report);
      const parsed = JSON.parse(json);

      // Cross-tabulation: factors object must contain all sub-analyses
      const factors = parsed.factors;
      expect(factors).toHaveProperty('pairings');
      expect(factors).toHaveProperty('factionBalance');
      expect(factors).toHaveProperty('positionEffect');
      expect(factors).toHaveProperty('skillImpact');
      expect(factors).toHaveProperty('hpCorrelation');
      expect(factors).toHaveProperty('meta');

      // Verify skill impact entries have the expected shape
      for (const si of factors.skillImpact) {
        expect(si).toHaveProperty('skillId');
        expect(si).toHaveProperty('skillName');
        expect(si).toHaveProperty('generalsWithSkill');
        expect(si).toHaveProperty('winRate');
        expect(si).toHaveProperty('winRateDelta');
      }

      // Verify HP correlation entries have the expected shape
      for (const hc of factors.hpCorrelation) {
        expect(hc).toHaveProperty('hp');
        expect(hc).toHaveProperty('generalCount');
        expect(hc).toHaveProperty('winRate');
      }
    });
  });
});
