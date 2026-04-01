/**
 * AI strategy interfaces for Sanguosha general evaluation and decision-making.
 */

import type { Card, GeneralId, Skill } from '@sgs/data';
import type { GameState, PlayerState, PlayerId } from '@sgs/engine';

// ---------------------------------------------------------------------------
// Strategy Scores
// ---------------------------------------------------------------------------

/** Multi-dimensional scoring of a general's strategic profile (0-10 scale). */
export interface StrategyScores {
  /** Ability to generate card advantage (draw, acquire, recover cards). */
  draw: number;
  /** Ability to control the board (discard, disable, manipulate). */
  control: number;
  /** Potential for burst damage output in a single turn. */
  burst: number;
  /** Defensive resilience (damage mitigation, HP recovery, evasion). */
  defense: number;
}

// ---------------------------------------------------------------------------
// Threat Assessment
// ---------------------------------------------------------------------------

/** How dangerous an opponent is relative to the assessing player. */
export interface ThreatAssessment {
  playerId: PlayerId;
  /** Overall threat level (0-10). */
  threatLevel: number;
  /** Hand size contributes to unpredictability. */
  handSize: number;
  /** Current HP (low HP = less threatening, but desperate). */
  hp: number;
  /** Whether the player has equipment that boosts offense/defense. */
  hasWeapon: boolean;
  hasArmor: boolean;
}

// ---------------------------------------------------------------------------
// Card Evaluation
// ---------------------------------------------------------------------------

/** Evaluated utility of a single card in hand. */
export interface CardScore {
  card: Card;
  /** Utility score; higher = more valuable to keep. */
  score: number;
}

// ---------------------------------------------------------------------------
// AI Decision Results
// ---------------------------------------------------------------------------

/** A play decision: which card to play and optional target. */
export interface PlayDecision {
  card: Card;
  targetId?: PlayerId;
}

/** A response decision: whether to respond and with which card. */
export interface ResponseDecision {
  respond: boolean;
  card?: Card;
}

/** A discard decision: ordered list of cards to discard. */
export interface DiscardDecision {
  cards: Card[];
}

/** A target selection: chosen target from candidates. */
export interface TargetDecision {
  targetId: PlayerId;
}

// ---------------------------------------------------------------------------
// GeneralAI Interface
// ---------------------------------------------------------------------------

/** Strategy interface that every general AI must implement. */
export interface GeneralAI {
  /**
   * Evaluate what to play during the play phase.
   * Returns null when the AI decides to pass.
   */
  evaluatePlay(game: GameState, player: PlayerState): PlayDecision | null;

  /**
   * Evaluate whether to respond to an incoming action
   * (e.g. play 闪 to dodge 杀, play 桃 to save).
   */
  evaluateResponse(
    game: GameState,
    player: PlayerState,
    responseType: string,
  ): ResponseDecision;

  /**
   * Select which cards to discard during the discard phase.
   * @param count Number of cards that must be discarded.
   */
  evaluateDiscard(
    game: GameState,
    player: PlayerState,
    count: number,
  ): DiscardDecision;

  /**
   * Select the best target from a list of candidate player IDs.
   */
  evaluateTarget(
    game: GameState,
    player: PlayerState,
    candidates: PlayerId[],
  ): TargetDecision;
}
