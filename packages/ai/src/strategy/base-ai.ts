/**
 * BaseAI — default strategy that all generals inherit.
 *
 * Provides reasonable heuristic decisions for card evaluation,
 * target selection, response handling, and discard priority.
 */

import type { Card } from '@sgs/data';
import type { GameState, PlayerState, PlayerId } from '@sgs/engine';
import type {
  CardScore,
  DiscardDecision,
  GeneralAI,
  PlayDecision,
  ResponseDecision,
  TargetDecision,
  ThreatAssessment,
} from './types.js';

// ---------------------------------------------------------------------------
// Card-name constants (Chinese card names used in Sanguosha)
// ---------------------------------------------------------------------------

const CARD_PEACH = '桃';
const CARD_DODGE = '闪';
const CARD_SLASH = '杀';
const CARD_NULLIFICATION = '无懈可击';

// ---------------------------------------------------------------------------
// Card Value Scoring
// ---------------------------------------------------------------------------

/**
 * Base value table for common cards.
 * Higher value = more desirable to keep in hand.
 */
const BASE_CARD_VALUES: Record<string, number> = {
  [CARD_PEACH]: 9,
  [CARD_DODGE]: 7,
  [CARD_NULLIFICATION]: 7,
  [CARD_SLASH]: 4,
  '酒': 6,
  '无中生有': 8,
  '过河拆桥': 6,
  '顺手牵羊': 6,
  '决斗': 5,
  '南蛮入侵': 5,
  '万箭齐发': 5,
  '桃园结义': 6,
  '五谷丰登': 5,
  '乐不思蜀': 6,
  '兵粮寸断': 5,
  '闪电': 3,
};

/** Score a single card by its base utility. */
function baseCardScore(card: Card): number {
  return BASE_CARD_VALUES[card.name] ?? 3;
}

/**
 * Score a card contextually based on the player's current state.
 * Low HP increases the value of defensive cards.
 */
function contextualCardScore(card: Card, player: PlayerState): number {
  let score = baseCardScore(card);
  const hpRatio = player.hp / player.maxHp;

  // At low HP, 桃 and 闪 become much more valuable
  if (hpRatio <= 0.5) {
    if (card.name === CARD_PEACH) score += 3;
    if (card.name === CARD_DODGE) score += 2;
  }

  // Equipment cards are valuable when slot is empty
  if (card.type === 'equipment') {
    const subtype = card.subtype;
    if (subtype && subtype in player.equipment) {
      const slotKey = subtype as keyof typeof player.equipment;
      if (player.equipment[slotKey] === null) {
        score += 2;
      }
    }
  }

  return score;
}

// ---------------------------------------------------------------------------
// Threat Assessment
// ---------------------------------------------------------------------------

/** Evaluate how threatening each living opponent is. */
function assessThreat(
  player: PlayerState,
  opponent: PlayerState,
): ThreatAssessment {
  let threatLevel = 0;

  // Hand size: more cards = more options = more dangerous
  threatLevel += Math.min(opponent.handCards.length, 5);

  // HP: healthy opponents are more threatening
  threatLevel += opponent.hp > 2 ? 2 : opponent.hp > 0 ? 1 : 0;

  // Weapon: increases offensive threat
  const hasWeapon = opponent.equipment.weapon !== null;
  if (hasWeapon) threatLevel += 1.5;

  // Armor: harder to kill, indirect threat
  const hasArmor = opponent.equipment.armor !== null;
  if (hasArmor) threatLevel += 0.5;

  // Clamp to 0-10
  threatLevel = Math.max(0, Math.min(10, threatLevel));

  return {
    playerId: opponent.id,
    threatLevel,
    handSize: opponent.handCards.length,
    hp: opponent.hp,
    hasWeapon,
    hasArmor,
  };
}

// ---------------------------------------------------------------------------
// BaseAI Class
// ---------------------------------------------------------------------------

export class BaseAI implements GeneralAI {
  // ---- Card Evaluation ----

  /** Score every card in hand, sorted descending by value. */
  scoreHand(player: PlayerState): CardScore[] {
    return player.handCards
      .map((card) => ({ card, score: contextualCardScore(card, player) }))
      .sort((a, b) => b.score - a.score);
  }

  // ---- Threat Assessment ----

  /** Return threat assessments for all living opponents, sorted by threat descending. */
  assessThreats(
    game: GameState,
    player: PlayerState,
  ): ThreatAssessment[] {
    return game.players
      .filter((p) => p.alive && p.id !== player.id)
      .map((opponent) => assessThreat(player, opponent))
      .sort((a, b) => b.threatLevel - a.threatLevel);
  }

  // ---- GeneralAI Implementation ----

  evaluatePlay(game: GameState, player: PlayerState): PlayDecision | null {
    // Simple heuristic: play first 杀 if available, targeting weakest enemy
    const slash = player.handCards.find((c) => c.name === CARD_SLASH);
    if (slash) {
      const enemies = game.players.filter(
        (p) => p.alive && p.id !== player.id,
      );
      if (enemies.length > 0) {
        const target = this.selectWeakestEnemy(enemies);
        return { card: slash, targetId: target.id };
      }
    }
    return null;
  }

  evaluateResponse(
    _game: GameState,
    player: PlayerState,
    responseType: string,
  ): ResponseDecision {
    // For 闪 response (dodging 杀): play if we have one and HP is not full
    if (responseType === CARD_DODGE) {
      const dodge = player.handCards.find((c) => c.name === CARD_DODGE);
      if (dodge) {
        return { respond: true, card: dodge };
      }
      return { respond: false };
    }

    // For 桃 response (saving self or ally): play if at risk of dying
    if (responseType === CARD_PEACH) {
      const peach = player.handCards.find((c) => c.name === CARD_PEACH);
      if (peach && player.hp <= 0) {
        // Always use peach if dying
        return { respond: true, card: peach };
      }
      if (peach && player.hp <= 1) {
        // Use peach when at 1 HP (very risky)
        return { respond: true, card: peach };
      }
      // Conserve peaches when HP is healthy
      return { respond: false };
    }

    return { respond: false };
  }

  evaluateDiscard(
    _game: GameState,
    player: PlayerState,
    count: number,
  ): DiscardDecision {
    // Score hand, discard lowest-value cards first
    const scored = this.scoreHand(player);
    // scored is sorted descending; take the last `count` items (lowest value)
    const toDiscard = scored
      .slice(-count)
      .map((s) => s.card);
    return { cards: toDiscard };
  }

  evaluateTarget(
    game: GameState,
    player: PlayerState,
    candidates: PlayerId[],
  ): TargetDecision {
    const candidateSet = new Set(candidates);
    const candidatePlayers = game.players.filter(
      (p) => p.alive && candidateSet.has(p.id),
    );

    if (candidatePlayers.length === 0) {
      // Fallback: return first candidate even if unusual
      return { targetId: candidates[0]! };
    }

    // Default strategy: target the weakest enemy (lowest HP, fewest cards)
    const weakest = this.selectWeakestEnemy(candidatePlayers);
    return { targetId: weakest.id };
  }

  // ---- Helpers ----

  /** Select the weakest enemy: lowest HP, breaking ties by fewest hand cards. */
  protected selectWeakestEnemy(enemies: PlayerState[]): PlayerState {
    return enemies.reduce((weakest, current) => {
      if (current.hp < weakest.hp) return current;
      if (
        current.hp === weakest.hp &&
        current.handCards.length < weakest.handCards.length
      ) {
        return current;
      }
      return weakest;
    });
  }
}
