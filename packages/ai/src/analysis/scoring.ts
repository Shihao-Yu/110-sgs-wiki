/**
 * MultiDimensionalScorer — compute draw/control/burst/defense scores
 * for generals and produce radar-chart-ready comparison data.
 *
 * Delegates per-general scoring to GeneralEvaluator, then wraps
 * the results into shapes suitable for frontend visualisation.
 */

import type { GeneralId } from '@sgs/data';
import type { StrategyScores } from '../strategy/types.js';
import { GeneralEvaluator } from '../strategy/evaluator.js';

// ---------------------------------------------------------------------------
// Output Interfaces
// ---------------------------------------------------------------------------

/** Radar chart data: dimension labels + one value array per general. */
export interface RadarChartData {
  dimensions: string[];
  /** One number[] per general, in the same order as the ids passed in. */
  values: number[][];
  /** General ids corresponding to each values row. */
  labels: string[];
}

/** Result of scoring a single general. */
export interface ScoredGeneral {
  generalId: string;
  scores: StrategyScores;
}

// ---------------------------------------------------------------------------
// MultiDimensionalScorer
// ---------------------------------------------------------------------------

export class MultiDimensionalScorer {
  private evaluator: GeneralEvaluator;

  constructor(evaluator: GeneralEvaluator) {
    this.evaluator = evaluator;
  }

  /**
   * Compute draw/control/burst/defense scores for a single general.
   * Returns null if the general is not found in the evaluator's data.
   */
  scoreGeneral(generalId: string): ScoredGeneral | null {
    const scores = this.evaluator.evaluateGeneral(generalId as GeneralId);
    if (!scores) return null;
    return { generalId, scores };
  }

  /**
   * Side-by-side comparison of multiple generals.
   *
   * Output is shaped for a radar/spider chart:
   *   dimensions: ["draw", "control", "burst", "defense"]
   *   values:     [[7, 3, 2, 5], [4, 8, 6, 3], ...]
   *   labels:     ["caocao", "simayi", ...]
   *
   * Generals that cannot be scored (unknown id) are omitted.
   */
  compareGenerals(ids: string[]): RadarChartData {
    const dimensions = ['draw', 'control', 'burst', 'defense'];
    const values: number[][] = [];
    const labels: string[] = [];

    for (const id of ids) {
      const result = this.scoreGeneral(id);
      if (!result) continue;

      const s = result.scores;
      values.push([s.draw, s.control, s.burst, s.defense]);
      labels.push(id);
    }

    return { dimensions, values, labels };
  }
}
