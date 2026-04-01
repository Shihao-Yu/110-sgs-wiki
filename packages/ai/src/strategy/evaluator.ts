/**
 * GeneralEvaluator — compute StrategyScores for any general
 * based on static skill analysis.
 *
 * Scoring is heuristic: we scan skill descriptions for keywords
 * that indicate draw, control, burst, or defense capabilities,
 * then combine with HP/maxHp baseline.
 */

import type { General, GeneralId, Skill } from '@sgs/data';
import type { StrategyScores } from './types.js';

// ---------------------------------------------------------------------------
// Keyword Patterns (Chinese skill descriptions)
// ---------------------------------------------------------------------------

/** Keywords indicating card-draw or card-acquisition capability. */
const DRAW_KEYWORDS = ['摸', '获得', '观看', '拿', '无中生有', '摸牌'];

/** Keywords indicating board control / disruption. */
const CONTROL_KEYWORDS = [
  '弃置',
  '拆',
  '顺手',
  '翻面',
  '横置',
  '封锁',
  '判定',
  '代替',
  '令其',
  '不能',
];

/** Keywords indicating burst damage potential. */
const BURST_KEYWORDS = [
  '伤害',
  '杀',
  '决斗',
  '体力流失',
  '点伤害',
  '火',
  '雷',
  '连环',
];

/** Keywords indicating defensive / survival capability. */
const DEFENSE_KEYWORDS = [
  '闪',
  '桃',
  '回复',
  '防止',
  '体力上限',
  '护甲',
  '减少',
  '不能被',
  '不会受到',
];

// ---------------------------------------------------------------------------
// Scoring Helpers
// ---------------------------------------------------------------------------

/** Count how many keywords from a list appear in a description. */
function countKeywordHits(description: string, keywords: readonly string[]): number {
  let hits = 0;
  for (const kw of keywords) {
    if (description.includes(kw)) hits++;
  }
  return hits;
}

/**
 * Compute a dimensional score from keyword hits and skill count.
 * Normalised to 0-10 range.
 */
function dimensionScore(
  totalHits: number,
  skillCount: number,
  hpFactor: number,
): number {
  // Raw score: hits contribute, with diminishing returns
  const raw = totalHits * 2.0 + skillCount * 0.5 + hpFactor;
  // Clamp to 0-10
  return Math.max(0, Math.min(10, Math.round(raw * 10) / 10));
}

// ---------------------------------------------------------------------------
// GeneralEvaluator
// ---------------------------------------------------------------------------

export class GeneralEvaluator {
  private generals: Map<GeneralId, General>;
  private skills: Map<string, Skill>;

  constructor(generals: General[], skills: Skill[]) {
    this.generals = new Map(generals.map((g) => [g.id, g]));
    this.skills = new Map(skills.map((s) => [s.id, s]));
  }

  /**
   * Compute StrategyScores for a general.
   * Returns null if generalId is not found.
   */
  evaluateGeneral(generalId: GeneralId): StrategyScores | null {
    const general = this.generals.get(generalId);
    if (!general) return null;

    // Gather all skill descriptions
    const generalSkills = general.skills
      .map((sid) => this.skills.get(sid as string))
      .filter((s): s is Skill => s !== undefined);

    const descriptions = generalSkills.map((s) => s.description).join(' ');
    const skillCount = generalSkills.length;

    // Keyword analysis per dimension
    const drawHits = countKeywordHits(descriptions, DRAW_KEYWORDS);
    const controlHits = countKeywordHits(descriptions, CONTROL_KEYWORDS);
    const burstHits = countKeywordHits(descriptions, BURST_KEYWORDS);
    const defenseHits = countKeywordHits(descriptions, DEFENSE_KEYWORDS);

    // HP baseline factors
    const hpBaseline = general.maxHp;
    const isLowHp = hpBaseline <= 3;

    return {
      draw: dimensionScore(drawHits, skillCount, isLowHp ? 0.5 : 0),
      control: dimensionScore(controlHits, skillCount, 0),
      burst: dimensionScore(burstHits, skillCount, isLowHp ? 0 : 0.5),
      defense: dimensionScore(defenseHits, skillCount, isLowHp ? 0 : hpBaseline * 0.3),
    };
  }
}
