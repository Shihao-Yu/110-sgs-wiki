/**
 * MonteCarloSimulator — run N simulated Sanguosha games and aggregate stats.
 *
 * Produces faction win rates, per-general statistics, and performance metrics.
 */

import { GameRunner, type PlayerSimTracking } from './game-runner.js';

// ---------------------------------------------------------------------------
// Config & Result Interfaces
// ---------------------------------------------------------------------------

export interface SimulationConfig {
  numGames: number;
  playerCount: 4 | 6 | 8;
  generalPool?: string[];  // restrict to specific generals
  seed?: number;           // for reproducibility
}

export interface GeneralSimStats {
  gamesPlayed: number;
  wins: number;
  winRate: number;
  avgSurvivalTurns: number;
  avgDamageDealt: number;
  avgDamageReceived: number;
  avgCardsDrawn: number;
}

export interface SimulationResult {
  totalGames: number;
  factionWinRates: Record<string, number>;  // faction -> win %
  generalStats: Map<string, GeneralSimStats>;
  averageTurns: number;
  duration: number;  // ms
}

// ---------------------------------------------------------------------------
// Accumulator for incremental stats collection
// ---------------------------------------------------------------------------

interface GeneralAccumulator {
  gamesPlayed: number;
  wins: number;
  totalSurvivalTurns: number;
  totalDamageDealt: number;
  totalDamageReceived: number;
  totalCardsDrawn: number;
}

// ---------------------------------------------------------------------------
// MonteCarloSimulator
// ---------------------------------------------------------------------------

export class MonteCarloSimulator {
  /**
   * Run `config.numGames` simulated games and return aggregated results.
   *
   * If `config.seed` is provided, results are deterministic for the same
   * config — each game `i` uses seed `baseSeed + i`.
   */
  simulate(config: SimulationConfig): SimulationResult {
    const {
      numGames,
      playerCount,
      generalPool,
      seed,
    } = config;

    const baseSeed = seed ?? Date.now();
    const startMs = performance.now();

    // Accumulators
    const factionWins: Record<string, number> = {};
    const generalAccum = new Map<string, GeneralAccumulator>();
    let totalTurns = 0;

    for (let i = 0; i < numGames; i++) {
      const gameSeed = baseSeed + i;
      const runner = new GameRunner(gameSeed);
      const result = runner.run(playerCount, generalPool);

      // Faction wins
      factionWins[result.winnerFaction] =
        (factionWins[result.winnerFaction] ?? 0) + 1;

      totalTurns += result.totalTurns;

      // Per-general accumulation
      for (const stat of result.playerStats) {
        let acc = generalAccum.get(stat.generalId);
        if (!acc) {
          acc = {
            gamesPlayed: 0,
            wins: 0,
            totalSurvivalTurns: 0,
            totalDamageDealt: 0,
            totalDamageReceived: 0,
            totalCardsDrawn: 0,
          };
          generalAccum.set(stat.generalId, acc);
        }

        acc.gamesPlayed++;
        if (stat.won) acc.wins++;
        acc.totalSurvivalTurns += stat.survivalTurn;
        acc.totalDamageDealt += stat.damageDealt;
        acc.totalDamageReceived += stat.damageReceived;
        acc.totalCardsDrawn += stat.cardsDrawn;
      }
    }

    const endMs = performance.now();

    // Compute faction win rates as percentages
    const factionWinRates: Record<string, number> = {};
    for (const [faction, wins] of Object.entries(factionWins)) {
      factionWinRates[faction] = (wins / numGames) * 100;
    }

    // Compute per-general stats
    const generalStats = new Map<string, GeneralSimStats>();
    for (const [gid, acc] of generalAccum) {
      const n = acc.gamesPlayed;
      generalStats.set(gid, {
        gamesPlayed: n,
        wins: acc.wins,
        winRate: n > 0 ? (acc.wins / n) * 100 : 0,
        avgSurvivalTurns: n > 0 ? acc.totalSurvivalTurns / n : 0,
        avgDamageDealt: n > 0 ? acc.totalDamageDealt / n : 0,
        avgDamageReceived: n > 0 ? acc.totalDamageReceived / n : 0,
        avgCardsDrawn: n > 0 ? acc.totalCardsDrawn / n : 0,
      });
    }

    return {
      totalGames: numGames,
      factionWinRates,
      generalStats,
      averageTurns: numGames > 0 ? totalTurns / numGames : 0,
      duration: endMs - startMs,
    };
  }
}
