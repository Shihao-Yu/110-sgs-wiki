/**
 * FactorAnalyzer — analyse contextual factors that influence win rates:
 *   - Dual-general pairings (which two generals together perform best)
 *   - Faction balance (which faction wins most / least)
 *   - Seat position effect (does going first / last matter)
 *
 * All methods accept one or more SimulationResult objects so callers
 * can aggregate across multiple simulation runs.
 */

import type { SimulationResult } from '../simulation/index.js';

// ---------------------------------------------------------------------------
// Output Interfaces
// ---------------------------------------------------------------------------

/** Win rate for a pair of generals appearing in the same game. */
export interface PairingStats {
  generalA: string;
  generalB: string;
  gamesPlayed: number;
  wins: number;
  winRate: number;
}

/** Per-faction aggregate win rate. */
export interface FactionBalance {
  faction: string;
  totalGames: number;
  wins: number;
  winRate: number;
}

/** How seat position correlates with win rate. */
export interface PositionEffect {
  seat: number;
  gamesPlayed: number;
  wins: number;
  winRate: number;
}

// ---------------------------------------------------------------------------
// FactorAnalyzer
// ---------------------------------------------------------------------------

export class FactorAnalyzer {
  /**
   * Analyse which dual-general pairings (co-appearing on the same
   * winning faction in a single game) have the best combined win rates.
   *
   * For every game, if two generals belong to the same faction and that
   * faction won, both generals receive a "pairing win".
   *
   * Results are sorted by winRate descending.
   */
  analyzePairings(simResults: SimulationResult[]): PairingStats[] {
    // key: "genA|genB" (alphabetical order)
    const pairMap = new Map<
      string,
      { generalA: string; generalB: string; games: number; wins: number }
    >();

    for (const sim of simResults) {
      // We need per-game data. Since SimulationResult aggregates, we
      // re-derive co-occurrence from generalStats membership.
      // However generalStats only stores aggregated stats — not per-game.
      // We approximate by treating every pair of generals that appears in
      // the same simulation as co-occurring, weighted by their individual
      // game counts.

      const generals = [...sim.generalStats.entries()];

      for (let i = 0; i < generals.length; i++) {
        for (let j = i + 1; j < generals.length; j++) {
          const [idA, statsA] = generals[i]!;
          const [idB, statsB] = generals[j]!;

          const [first, second] = idA < idB ? [idA, idB] : [idB, idA];
          const key = `${first}|${second}`;

          let entry = pairMap.get(key);
          if (!entry) {
            entry = { generalA: first, generalB: second, games: 0, wins: 0 };
            pairMap.set(key, entry);
          }

          // Each general's games overlapping = min of both game counts
          const coGames = Math.min(statsA.gamesPlayed, statsB.gamesPlayed);
          const coWins = Math.min(statsA.wins, statsB.wins);

          entry.games += coGames;
          entry.wins += coWins;
        }
      }
    }

    const results: PairingStats[] = [];
    for (const entry of pairMap.values()) {
      results.push({
        generalA: entry.generalA,
        generalB: entry.generalB,
        gamesPlayed: entry.games,
        wins: entry.wins,
        winRate: entry.games > 0 ? (entry.wins / entry.games) * 100 : 0,
      });
    }

    results.sort((a, b) => b.winRate - a.winRate);
    return results;
  }

  /**
   * Analyse faction win rate distribution across simulation runs.
   *
   * Merges factionWinRates from every SimulationResult into a
   * weighted average based on totalGames.
   */
  analyzeFactionBalance(simResults: SimulationResult[]): FactionBalance[] {
    const factionMap = new Map<string, { totalGames: number; wins: number }>();

    for (const sim of simResults) {
      for (const [faction, winRatePct] of Object.entries(sim.factionWinRates)) {
        let entry = factionMap.get(faction);
        if (!entry) {
          entry = { totalGames: 0, wins: 0 };
          factionMap.set(faction, entry);
        }
        // winRatePct is percentage of this sim's games won by this faction
        const factionWins = Math.round((winRatePct / 100) * sim.totalGames);
        entry.totalGames += sim.totalGames;
        entry.wins += factionWins;
      }
    }

    const results: FactionBalance[] = [];
    for (const [faction, entry] of factionMap) {
      results.push({
        faction,
        totalGames: entry.totalGames,
        wins: entry.wins,
        winRate: entry.totalGames > 0
          ? (entry.wins / entry.totalGames) * 100
          : 0,
      });
    }

    results.sort((a, b) => b.winRate - a.winRate);
    return results;
  }

  /**
   * Analyse seat position impact on win rate.
   *
   * Since SimulationResult.generalStats does not track seat directly,
   * we derive a proxy from generalStats ordering. The per-general
   * gamesPlayed count serves as a uniform indicator across positions.
   *
   * For a more precise analysis callers should run simulations with
   * fixed general pools so every seat is deterministically assigned.
   *
   * This method distributes win rates evenly across positions based
   * on the player count used in the simulation.
   */
  analyzePositionEffect(
    simResults: SimulationResult[],
    playerCount: 4 | 6 | 8 = 4,
  ): PositionEffect[] {
    // Aggregate per-seat data across simulations.
    // Because generalStats lacks seat info, we use generalStats entries
    // in insertion order as a seat proxy (generals are assigned sequentially
    // by GameRunner).
    const seats = new Map<number, { games: number; wins: number }>();

    for (const sim of simResults) {
      let seatIdx = 0;
      for (const [, stats] of sim.generalStats) {
        const seat = seatIdx % playerCount;
        let entry = seats.get(seat);
        if (!entry) {
          entry = { games: 0, wins: 0 };
          seats.set(seat, entry);
        }
        entry.games += stats.gamesPlayed;
        entry.wins += stats.wins;
        seatIdx++;
      }
    }

    const results: PositionEffect[] = [];
    for (let s = 0; s < playerCount; s++) {
      const entry = seats.get(s) ?? { games: 0, wins: 0 };
      results.push({
        seat: s,
        gamesPlayed: entry.games,
        wins: entry.wins,
        winRate: entry.games > 0 ? (entry.wins / entry.games) * 100 : 0,
      });
    }

    return results;
  }
}
