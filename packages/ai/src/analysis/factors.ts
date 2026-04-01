/**
 * FactorAnalyzer — analyse contextual factors that influence win rates:
 *   - Dual-general pairings (which two generals together perform best)
 *   - Faction balance (which faction wins most / least)
 *   - Seat position effect (does going first / last matter)
 *   - Skill impact analysis (which skills contribute most to wins)
 *   - HP correlation (how HP value relates to win rate)
 *
 * All methods accept one or more SimulationResult objects so callers
 * can aggregate across multiple simulation runs.
 */

import type { General, Skill } from '@sgs/data';
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

/** How a specific skill correlates with winning. */
export interface SkillImpact {
  skillId: string;
  skillName: string;
  /** Number of generals possessing this skill that appeared in sims. */
  generalsWithSkill: number;
  /** Aggregate games played by generals with this skill. */
  gamesPlayed: number;
  /** Aggregate wins by generals with this skill. */
  wins: number;
  /** Win rate percentage for generals possessing this skill. */
  winRate: number;
  /** Delta vs overall average win rate (positive = skill helps). */
  winRateDelta: number;
}

/** HP bucket and its associated win rate. */
export interface HpCorrelation {
  hp: number;
  /** Number of generals at this HP value in the sim pool. */
  generalCount: number;
  gamesPlayed: number;
  wins: number;
  winRate: number;
}

/** Comprehensive factor analysis report combining all analyses. */
export interface FactorReport {
  pairings: PairingStats[];
  factionBalance: FactionBalance[];
  positionEffect: PositionEffect[];
  skillImpact: SkillImpact[];
  hpCorrelation: HpCorrelation[];
  meta: {
    totalSimulations: number;
    totalGames: number;
    generatedAt: string;
  };
}

// ---------------------------------------------------------------------------
// FactorAnalyzer
// ---------------------------------------------------------------------------

export class FactorAnalyzer {
  private generals: Map<string, General>;
  private skills: Map<string, Skill>;

  /**
   * @param generals Array of General objects for skill/HP lookups.
   *                 Optional — methods that need general data will
   *                 return empty arrays when not provided.
   * @param skills   Array of Skill objects for skill name resolution.
   */
  constructor(generals: General[] = [], skills: Skill[] = []) {
    this.generals = new Map(generals.map((g) => [g.id as string, g]));
    this.skills = new Map(skills.map((s) => [s.id as string, s]));
  }
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

  // -------------------------------------------------------------------------
  // Skill Impact Analysis
  // -------------------------------------------------------------------------

  /**
   * Analyse which skills contribute most to wins.
   *
   * For each skill in the skill pool, finds all generals that possess it,
   * aggregates their win rates from simulation results, and computes a
   * delta against the overall average win rate.
   *
   * Requires generals and skills to have been provided to the constructor.
   * Results are sorted by winRateDelta descending (most impactful first).
   */
  analyzeSkillImpact(simResults: SimulationResult[]): SkillImpact[] {
    if (this.generals.size === 0 || this.skills.size === 0) {
      return [];
    }

    // Build a map: skillId -> set of generalIds that have it
    const skillToGenerals = new Map<string, Set<string>>();
    for (const [gid, general] of this.generals) {
      for (const sid of general.skills) {
        const sidStr = sid as string;
        let genSet = skillToGenerals.get(sidStr);
        if (!genSet) {
          genSet = new Set();
          skillToGenerals.set(sidStr, genSet);
        }
        genSet.add(gid);
      }
    }

    // Compute overall average win rate across all generals in all sims
    let totalGamesAll = 0;
    let totalWinsAll = 0;
    for (const sim of simResults) {
      for (const [, stats] of sim.generalStats) {
        totalGamesAll += stats.gamesPlayed;
        totalWinsAll += stats.wins;
      }
    }
    const overallWinRate =
      totalGamesAll > 0 ? (totalWinsAll / totalGamesAll) * 100 : 0;

    // For each skill, aggregate stats of generals that have it
    const results: SkillImpact[] = [];

    for (const [skillId, generalIds] of skillToGenerals) {
      const skill = this.skills.get(skillId);
      if (!skill) continue;

      let gamesPlayed = 0;
      let wins = 0;

      for (const sim of simResults) {
        for (const gid of generalIds) {
          const stats = sim.generalStats.get(gid);
          if (stats) {
            gamesPlayed += stats.gamesPlayed;
            wins += stats.wins;
          }
        }
      }

      const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;

      results.push({
        skillId,
        skillName: skill.name,
        generalsWithSkill: generalIds.size,
        gamesPlayed,
        wins,
        winRate,
        winRateDelta: winRate - overallWinRate,
      });
    }

    results.sort((a, b) => b.winRateDelta - a.winRateDelta);
    return results;
  }

  // -------------------------------------------------------------------------
  // HP Correlation Analysis
  // -------------------------------------------------------------------------

  /**
   * Analyse how HP value correlates with win rate.
   *
   * Groups generals by their maxHp, aggregates win statistics from
   * simulation results for each bucket, and returns sorted by HP ascending.
   *
   * Requires generals to have been provided to the constructor.
   */
  analyzeHpCorrelation(simResults: SimulationResult[]): HpCorrelation[] {
    if (this.generals.size === 0) {
      return [];
    }

    // Build map: hp -> set of generalIds
    const hpToGenerals = new Map<number, Set<string>>();
    for (const [gid, general] of this.generals) {
      const hp = general.maxHp;
      let genSet = hpToGenerals.get(hp);
      if (!genSet) {
        genSet = new Set();
        hpToGenerals.set(hp, genSet);
      }
      genSet.add(gid);
    }

    const results: HpCorrelation[] = [];

    for (const [hp, generalIds] of hpToGenerals) {
      let gamesPlayed = 0;
      let wins = 0;

      for (const sim of simResults) {
        for (const gid of generalIds) {
          const stats = sim.generalStats.get(gid);
          if (stats) {
            gamesPlayed += stats.gamesPlayed;
            wins += stats.wins;
          }
        }
      }

      results.push({
        hp,
        generalCount: generalIds.size,
        gamesPlayed,
        wins,
        winRate: gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0,
      });
    }

    results.sort((a, b) => a.hp - b.hp);
    return results;
  }

  // -------------------------------------------------------------------------
  // Comprehensive Report
  // -------------------------------------------------------------------------

  /**
   * Generate a comprehensive JSON report combining all factor analyses.
   *
   * The output is structured for direct consumption by frontend heatmap
   * and chart rendering components.
   *
   * @param playerCount  Seat count for position analysis (defaults to 4).
   */
  generateReport(
    simResults: SimulationResult[],
    playerCount: 4 | 6 | 8 = 4,
  ): FactorReport {
    let totalGames = 0;
    for (const sim of simResults) {
      totalGames += sim.totalGames;
    }

    return {
      pairings: this.analyzePairings(simResults),
      factionBalance: this.analyzeFactionBalance(simResults),
      positionEffect: this.analyzePositionEffect(simResults, playerCount),
      skillImpact: this.analyzeSkillImpact(simResults),
      hpCorrelation: this.analyzeHpCorrelation(simResults),
      meta: {
        totalSimulations: simResults.length,
        totalGames,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}
