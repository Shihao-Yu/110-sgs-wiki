import { describe, it, expect } from 'vitest';
import { MonteCarloSimulator } from './simulator.js';
import { GameRunner, SeededRandom } from './game-runner.js';

// ---------------------------------------------------------------------------
// SeededRandom
// ---------------------------------------------------------------------------

describe('SeededRandom', () => {
  it('produces deterministic sequences from the same seed', () => {
    const rng1 = new SeededRandom(42);
    const rng2 = new SeededRandom(42);

    const seq1 = Array.from({ length: 20 }, () => rng1.next());
    const seq2 = Array.from({ length: 20 }, () => rng2.next());

    expect(seq1).toEqual(seq2);
  });

  it('produces values in [0, 1)', () => {
    const rng = new SeededRandom(123);
    for (let i = 0; i < 100; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

// ---------------------------------------------------------------------------
// GameRunner — single game
// ---------------------------------------------------------------------------

describe('GameRunner', () => {
  it('runs a single game to completion without errors', () => {
    const runner = new GameRunner(12345);
    const result = runner.run(4);

    expect(result.winnerFaction).toBeTruthy();
    expect(result.totalTurns).toBeGreaterThan(0);
    expect(result.totalTurns).toBeLessThanOrEqual(50);
    expect(result.playerStats).toHaveLength(4);
  });

  it('supports 6-player and 8-player games', () => {
    const runner6 = new GameRunner(111);
    const result6 = runner6.run(6);
    expect(result6.playerStats).toHaveLength(6);

    const runner8 = new GameRunner(222);
    const result8 = runner8.run(8);
    expect(result8.playerStats).toHaveLength(8);
  });

  it('each player has valid tracking stats', () => {
    const runner = new GameRunner(54321);
    const result = runner.run(4);

    for (const stat of result.playerStats) {
      expect(stat.generalId).toBeTruthy();
      expect(stat.faction).toBeTruthy();
      expect(stat.damageDealt).toBeGreaterThanOrEqual(0);
      expect(stat.damageReceived).toBeGreaterThanOrEqual(0);
      expect(stat.cardsDrawn).toBeGreaterThan(0);
      expect(stat.survivalTurn).toBeGreaterThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// MonteCarloSimulator
// ---------------------------------------------------------------------------

describe('MonteCarloSimulator', () => {
  const simulator = new MonteCarloSimulator();

  it('can run 10 games without errors', () => {
    const result = simulator.simulate({
      numGames: 10,
      playerCount: 4,
      seed: 42,
    });

    expect(result.totalGames).toBe(10);
    expect(result.averageTurns).toBeGreaterThan(0);
    expect(result.duration).toBeGreaterThanOrEqual(0);
    expect(result.generalStats.size).toBeGreaterThan(0);
  });

  it('results have valid win rates (sum to ~100%)', () => {
    const result = simulator.simulate({
      numGames: 50,
      playerCount: 4,
      seed: 99,
    });

    const totalWinRate = Object.values(result.factionWinRates)
      .reduce((sum, rate) => sum + rate, 0);

    // Win rates should sum to 100% (each game has exactly one winner)
    expect(totalWinRate).toBeCloseTo(100, 0);

    // Each individual rate should be between 0 and 100
    for (const rate of Object.values(result.factionWinRates)) {
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(100);
    }
  });

  it('seed produces deterministic results', () => {
    const result1 = simulator.simulate({
      numGames: 20,
      playerCount: 4,
      seed: 777,
    });

    const result2 = simulator.simulate({
      numGames: 20,
      playerCount: 4,
      seed: 777,
    });

    // Faction win rates must be identical
    expect(result1.factionWinRates).toEqual(result2.factionWinRates);

    // Average turns must be identical
    expect(result1.averageTurns).toBe(result2.averageTurns);

    // Per-general stats must be identical
    expect(result1.generalStats.size).toBe(result2.generalStats.size);
    for (const [gid, stats1] of result1.generalStats) {
      const stats2 = result2.generalStats.get(gid);
      expect(stats2).toBeDefined();
      expect(stats1.gamesPlayed).toBe(stats2!.gamesPlayed);
      expect(stats1.wins).toBe(stats2!.wins);
      expect(stats1.winRate).toBe(stats2!.winRate);
    }
  });

  it('performance: 100 games in < 30 seconds', () => {
    const start = performance.now();
    const result = simulator.simulate({
      numGames: 100,
      playerCount: 4,
      seed: 1234,
    });
    const elapsed = performance.now() - start;

    expect(result.totalGames).toBe(100);
    expect(elapsed).toBeLessThan(30_000);
  });

  it('general stats contain valid averages', () => {
    const result = simulator.simulate({
      numGames: 20,
      playerCount: 4,
      seed: 555,
    });

    for (const [gid, stats] of result.generalStats) {
      expect(stats.gamesPlayed).toBeGreaterThan(0);
      expect(stats.winRate).toBeGreaterThanOrEqual(0);
      expect(stats.winRate).toBeLessThanOrEqual(100);
      expect(stats.avgSurvivalTurns).toBeGreaterThanOrEqual(0);
      expect(stats.avgDamageDealt).toBeGreaterThanOrEqual(0);
      expect(stats.avgDamageReceived).toBeGreaterThanOrEqual(0);
      expect(stats.avgCardsDrawn).toBeGreaterThan(0);
    }
  });

  it('respects generalPool restriction', () => {
    const pool = ['caocao', 'liubei', 'sunquan', 'lvbu'];
    const result = simulator.simulate({
      numGames: 10,
      playerCount: 4,
      generalPool: pool,
      seed: 888,
    });

    // All generals in the result should come from the pool
    for (const [gid] of result.generalStats) {
      expect(pool).toContain(gid);
    }
  });

  it('supports 8-player simulations', () => {
    const result = simulator.simulate({
      numGames: 5,
      playerCount: 8,
      seed: 333,
    });

    expect(result.totalGames).toBe(5);
    expect(result.averageTurns).toBeGreaterThan(0);
  });
});
