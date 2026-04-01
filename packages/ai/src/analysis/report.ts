/**
 * AnalysisReportGenerator — combines win rates, scoring, and factor analysis
 * into a single JSON report exportable for frontend static loading.
 *
 * The output shape is designed so a frontend can:
 *   1. Load the JSON file statically (import or fetch).
 *   2. Feed sections directly to chart/heatmap components.
 */

import type { General, Skill } from '@sgs/data';
import type { SimulationResult } from '../simulation/index.js';
import { WinRateCalculator, type LeaderboardEntry } from './winrate.js';
import { FactorAnalyzer, type FactorReport } from './factors.js';
import {
  MultiDimensionalScorer,
  type RadarChartData,
} from './scoring.js';
import { GeneralEvaluator } from '../strategy/evaluator.js';

// ---------------------------------------------------------------------------
// Report Interface
// ---------------------------------------------------------------------------

/** Complete analysis report combining all analysis modules. */
export interface AnalysisReport {
  /** Per-general win rate leaderboard. */
  leaderboard: LeaderboardEntry[];
  /** Radar chart data for strategy dimension comparison. */
  radarChart: RadarChartData;
  /** Comprehensive factor analysis (pairings, factions, skills, HP, etc.). */
  factors: FactorReport;
  /** Report metadata. */
  meta: {
    generatedAt: string;
    totalSimulations: number;
    totalGames: number;
    generalCount: number;
    playerCount: 4 | 6 | 8;
  };
}

// ---------------------------------------------------------------------------
// AnalysisReportGenerator
// ---------------------------------------------------------------------------

export class AnalysisReportGenerator {
  private generals: General[];
  private skills: Skill[];
  private playerCount: 4 | 6 | 8;

  constructor(
    generals: General[],
    skills: Skill[],
    playerCount: 4 | 6 | 8 = 4,
  ) {
    this.generals = generals;
    this.skills = skills;
    this.playerCount = playerCount;
  }

  /**
   * Generate a full analysis report from one or more simulation results.
   *
   * Merges leaderboard data from the first result (or a merged view),
   * computes radar chart scores for all generals, and runs the full
   * factor analysis pipeline.
   */
  generate(simResults: SimulationResult[]): AnalysisReport {
    if (simResults.length === 0) {
      return this.emptyReport();
    }

    // --- Leaderboard ---
    const winRateCalc = new WinRateCalculator();
    const mergedStats = this.mergeGeneralStats(simResults);
    const leaderboard = winRateCalc.rankGenerals(mergedStats);

    // --- Radar chart ---
    const evaluator = new GeneralEvaluator(this.generals, this.skills);
    const scorer = new MultiDimensionalScorer(evaluator);
    const generalIds = [...mergedStats.keys()];
    const radarChart = scorer.compareGenerals(generalIds);

    // --- Factor analysis ---
    const factorAnalyzer = new FactorAnalyzer(this.generals, this.skills);
    const factors = factorAnalyzer.generateReport(simResults, this.playerCount);

    // --- Meta ---
    let totalGames = 0;
    for (const sim of simResults) {
      totalGames += sim.totalGames;
    }

    return {
      leaderboard,
      radarChart,
      factors,
      meta: {
        generatedAt: new Date().toISOString(),
        totalSimulations: simResults.length,
        totalGames,
        generalCount: mergedStats.size,
        playerCount: this.playerCount,
      },
    };
  }

  /**
   * Serialise a report to a JSON string suitable for writing to a file.
   *
   * Maps are converted to plain objects so the output is valid JSON.
   */
  static toJSON(report: AnalysisReport): string {
    return JSON.stringify(report, null, 2);
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  /**
   * Merge generalStats across multiple simulation results into a single
   * Map keyed by generalId with aggregated stats.
   */
  private mergeGeneralStats(
    simResults: SimulationResult[],
  ): Map<
    string,
    {
      gamesPlayed: number;
      wins: number;
      winRate: number;
      avgSurvivalTurns: number;
      avgDamageDealt: number;
      avgDamageReceived: number;
      avgCardsDrawn: number;
    }
  > {
    const merged = new Map<
      string,
      {
        gamesPlayed: number;
        wins: number;
        totalSurvival: number;
        totalDamageDealt: number;
        totalDamageReceived: number;
        totalCardsDrawn: number;
      }
    >();

    for (const sim of simResults) {
      for (const [gid, stats] of sim.generalStats) {
        let entry = merged.get(gid);
        if (!entry) {
          entry = {
            gamesPlayed: 0,
            wins: 0,
            totalSurvival: 0,
            totalDamageDealt: 0,
            totalDamageReceived: 0,
            totalCardsDrawn: 0,
          };
          merged.set(gid, entry);
        }
        entry.gamesPlayed += stats.gamesPlayed;
        entry.wins += stats.wins;
        entry.totalSurvival += stats.avgSurvivalTurns * stats.gamesPlayed;
        entry.totalDamageDealt += stats.avgDamageDealt * stats.gamesPlayed;
        entry.totalDamageReceived += stats.avgDamageReceived * stats.gamesPlayed;
        entry.totalCardsDrawn += stats.avgCardsDrawn * stats.gamesPlayed;
      }
    }

    const result = new Map<
      string,
      {
        gamesPlayed: number;
        wins: number;
        winRate: number;
        avgSurvivalTurns: number;
        avgDamageDealt: number;
        avgDamageReceived: number;
        avgCardsDrawn: number;
      }
    >();

    for (const [gid, entry] of merged) {
      const n = entry.gamesPlayed;
      result.set(gid, {
        gamesPlayed: n,
        wins: entry.wins,
        winRate: n > 0 ? (entry.wins / n) * 100 : 0,
        avgSurvivalTurns: n > 0 ? entry.totalSurvival / n : 0,
        avgDamageDealt: n > 0 ? entry.totalDamageDealt / n : 0,
        avgDamageReceived: n > 0 ? entry.totalDamageReceived / n : 0,
        avgCardsDrawn: n > 0 ? entry.totalCardsDrawn / n : 0,
      });
    }

    return result;
  }

  private emptyReport(): AnalysisReport {
    return {
      leaderboard: [],
      radarChart: { dimensions: ['draw', 'control', 'burst', 'defense'], values: [], labels: [] },
      factors: {
        pairings: [],
        factionBalance: [],
        positionEffect: [],
        skillImpact: [],
        hpCorrelation: [],
        meta: { totalSimulations: 0, totalGames: 0, generatedAt: new Date().toISOString() },
      },
      meta: {
        generatedAt: new Date().toISOString(),
        totalSimulations: 0,
        totalGames: 0,
        generalCount: 0,
        playerCount: this.playerCount,
      },
    };
  }
}
