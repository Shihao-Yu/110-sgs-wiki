/**
 * WinRateCalculator — extract, rank, and query per-general win rates
 * from MonteCarloSimulator results.
 *
 * Output shapes are designed for direct consumption by a frontend
 * leaderboard component.
 */

import type { SimulationResult, GeneralSimStats } from '../simulation/index.js';

// ---------------------------------------------------------------------------
// Output Interfaces
// ---------------------------------------------------------------------------

/** A single row in the leaderboard. */
export interface LeaderboardEntry {
  rank: number;
  generalId: string;
  winRate: number;
  gamesPlayed: number;
  wins: number;
  avgSurvivalTurns: number;
  avgDamageDealt: number;
}

// ---------------------------------------------------------------------------
// WinRateCalculator
// ---------------------------------------------------------------------------

export class WinRateCalculator {
  /**
   * Extract per-general win rate records from a SimulationResult.
   *
   * Returns a Map of generalId -> { winRate, gamesPlayed, wins, ... }
   * identical in shape to `SimulationResult.generalStats` but as a
   * plain object map for easier serialisation.
   */
  computeWinRates(
    simResult: SimulationResult,
  ): Map<string, GeneralSimStats> {
    // generalStats is already computed by the simulator; pass through.
    return simResult.generalStats;
  }

  /**
   * Sort generals by win rate descending, producing an ordered
   * LeaderboardEntry array with 1-based ranks.
   */
  rankGenerals(stats: Map<string, GeneralSimStats>): LeaderboardEntry[] {
    const entries: LeaderboardEntry[] = [];

    for (const [generalId, s] of stats) {
      entries.push({
        rank: 0, // assigned below
        generalId,
        winRate: s.winRate,
        gamesPlayed: s.gamesPlayed,
        wins: s.wins,
        avgSurvivalTurns: s.avgSurvivalTurns,
        avgDamageDealt: s.avgDamageDealt,
      });
    }

    // Sort descending by win rate, break ties by total wins, then games played
    entries.sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.gamesPlayed - a.gamesPlayed;
    });

    // Assign 1-based ranks
    for (let i = 0; i < entries.length; i++) {
      entries[i]!.rank = i + 1;
    }

    return entries;
  }

  /**
   * Convenience: return the top N generals by win rate.
   *
   * @param stats  Per-general stats map from computeWinRates or SimulationResult.generalStats
   * @param n      Number of top generals to return (defaults to 5)
   */
  getTopGenerals(
    stats: Map<string, GeneralSimStats>,
    n = 5,
  ): LeaderboardEntry[] {
    const ranked = this.rankGenerals(stats);
    return ranked.slice(0, Math.min(n, ranked.length));
  }
}
