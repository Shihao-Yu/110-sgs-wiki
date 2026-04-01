/**
 * AIPlayer — combines BaseAI heuristics with per-general profile overrides.
 *
 * The general profile modifies:
 *  - Card value scoring  (cardValueOverrides, discardProtect)
 *  - Target selection     (targetStrategy)
 *  - Response thresholds  (dodgeThreshold, peachThreshold)
 *  - Play aggression      (aggressiveness)
 */

import type { Card, GeneralId } from '@sgs/data';
import type { GameState, PlayerState, PlayerId } from '@sgs/engine';
import { BaseAI } from '../strategy/base-ai.js';
import type {
  CardScore,
  DiscardDecision,
  GeneralAI,
  PlayDecision,
  ResponseDecision,
  TargetDecision,
  ThreatAssessment,
} from '../strategy/types.js';
import { getProfile, type GeneralProfile, type TargetStrategy } from './profiles.js';

// ---------------------------------------------------------------------------
// Action / Response Types (thin wrappers matching the task spec)
// ---------------------------------------------------------------------------

/** An action the AI wants to take during its turn. */
export interface Action {
  type: 'play' | 'skill' | 'pass';
  card?: Card;
  targetId?: PlayerId;
}

/** A game event the AI must respond to. */
export interface GameEvent {
  type: string;
  sourceId?: PlayerId;
  targetId?: PlayerId;
  card?: Card;
  /** The kind of response expected (e.g. '闪', '桃', '杀'). */
  responseType: string;
}

/** The AI's response to a game event. */
export interface Response {
  respond: boolean;
  card?: Card;
}

// ---------------------------------------------------------------------------
// AIPlayer Class
// ---------------------------------------------------------------------------

export class AIPlayer implements GeneralAI {
  /** Underlying baseline AI that provides default heuristics. */
  private readonly base: BaseAI;
  /** General-specific profile overrides. */
  readonly profile: GeneralProfile;

  constructor(generalId: string) {
    this.base = new BaseAI();
    this.profile = getProfile(generalId as GeneralId);
  }

  // -----------------------------------------------------------------------
  // Public API matching the task spec
  // -----------------------------------------------------------------------

  /**
   * Decide what to do during the play phase.
   * Returns an ordered list of actions (may be empty → pass).
   */
  decideTurn(game: GameState, player: PlayerState): Action[] {
    const actions: Action[] = [];

    // Determine how many slashes we can play.
    // Generals with aggressiveness >= 0.95 treat it as "unlimited" (zhangfei / lvbu style).
    const maxSlashes = this.profile.aggressiveness >= 0.95 ? Infinity : 1;
    let slashesPlayed = 0;

    // Score hand cards with profile overrides
    const scored = this.scoreHand(player);

    for (const { card } of scored) {
      // Skip non-playable cards used purely for defense
      if (card.name === '闪' || card.name === '桃' || card.name === '酒') continue;

      if (card.name === '杀') {
        if (slashesPlayed >= maxSlashes) continue;

        // Only play 杀 if aggressiveness exceeds a random-ish threshold
        // (deterministic: compare against 0.3 so moderately aggressive generals always attack)
        if (this.profile.aggressiveness < 0.3) continue;

        const target = this.pickTarget(game, player);
        if (target) {
          actions.push({ type: 'play', card, targetId: target });
          slashesPlayed++;
        }
        continue;
      }

      // Trick cards — play offensively if aggressive enough
      if (card.type === 'trick' && card.subtype !== 'delayedTrick') {
        if (card.name === '无懈可击') continue; // reactive only
        const target = this.pickTarget(game, player);
        if (target) {
          actions.push({ type: 'play', card, targetId: target });
        }
        continue;
      }

      // Equipment — always equip
      if (card.type === 'equipment') {
        actions.push({ type: 'play', card });
      }
    }

    if (actions.length === 0) {
      actions.push({ type: 'pass' });
    }

    return actions;
  }

  /**
   * Decide how to respond to a game event (e.g. dodge a 杀, play a 桃).
   */
  decideResponse(
    game: GameState,
    player: PlayerState,
    event: GameEvent,
  ): Response {
    const decision = this.evaluateResponse(game, player, event.responseType);
    return { respond: decision.respond, card: decision.card };
  }

  // -----------------------------------------------------------------------
  // GeneralAI Interface — profile-aware overrides
  // -----------------------------------------------------------------------

  /**
   * Score hand cards using BaseAI scoring + profile card-value overrides.
   * Protected cards (discardProtect) receive a bonus.
   */
  scoreHand(player: PlayerState): CardScore[] {
    const baseScores = this.base.scoreHand(player);
    return baseScores
      .map(({ card, score }) => {
        let adjusted = score;
        // Apply card-value overrides from profile
        const delta = this.profile.cardValueOverrides[card.name];
        if (delta !== undefined) adjusted += delta;
        // discardProtect bonus (makes them less likely to be discarded)
        if (this.profile.discardProtect.includes(card.name)) adjusted += 1;
        return { card, score: adjusted };
      })
      .sort((a, b) => b.score - a.score);
  }

  evaluatePlay(game: GameState, player: PlayerState): PlayDecision | null {
    // Use the decideTurn actions; return first play action as PlayDecision
    const actions = this.decideTurn(game, player);
    const playAction = actions.find((a) => a.type === 'play' && a.card);
    if (playAction && playAction.card) {
      return { card: playAction.card, targetId: playAction.targetId };
    }
    return null;
  }

  evaluateResponse(
    _game: GameState,
    player: PlayerState,
    responseType: string,
  ): ResponseDecision {
    const hpRatio = player.hp / player.maxHp;

    if (responseType === '闪') {
      const dodge = player.handCards.find((c) => c.name === '闪');
      // Also check for 杀 usable as 闪 (zhaoyun's 龙胆 style)
      const slashAsDodge =
        this.profile.cardValueOverrides['杀'] !== undefined &&
        this.profile.cardValueOverrides['闪'] !== undefined
          ? player.handCards.find((c) => c.name === '杀')
          : undefined;

      if (dodge && hpRatio <= this.profile.dodgeThreshold) {
        return { respond: true, card: dodge };
      }
      if (!dodge && slashAsDodge && hpRatio <= this.profile.dodgeThreshold) {
        return { respond: true, card: slashAsDodge };
      }
      return { respond: false };
    }

    if (responseType === '桃') {
      const peach = player.handCards.find((c) => c.name === '桃');
      if (peach && (player.hp <= 0 || hpRatio <= this.profile.peachThreshold)) {
        return { respond: true, card: peach };
      }
      return { respond: false };
    }

    // 杀 response (e.g. responding to 决斗)
    if (responseType === '杀') {
      const slash = player.handCards.find((c) => c.name === '杀');
      if (slash && this.profile.aggressiveness >= 0.5) {
        return { respond: true, card: slash };
      }
      return { respond: false };
    }

    return { respond: false };
  }

  evaluateDiscard(
    _game: GameState,
    player: PlayerState,
    count: number,
  ): DiscardDecision {
    // Score with profile overrides, then discard lowest-value cards
    const scored = this.scoreHand(player);
    const toDiscard = scored.slice(-count).map((s) => s.card);
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
      return { targetId: candidates[0]! };
    }

    const selected = this.selectByStrategy(candidatePlayers, this.profile.targetStrategy);
    return { targetId: selected.id };
  }

  // -----------------------------------------------------------------------
  // Threat Assessment (delegates to BaseAI)
  // -----------------------------------------------------------------------

  assessThreats(game: GameState, player: PlayerState): ThreatAssessment[] {
    return this.base.assessThreats(game, player);
  }

  // -----------------------------------------------------------------------
  // Private Helpers
  // -----------------------------------------------------------------------

  /**
   * Pick best target among all living enemies using the profile's strategy.
   * Returns undefined if no valid targets exist.
   */
  private pickTarget(game: GameState, player: PlayerState): PlayerId | undefined {
    const enemies = game.players.filter(
      (p) => p.alive && p.id !== player.id,
    );
    if (enemies.length === 0) return undefined;
    return this.selectByStrategy(enemies, this.profile.targetStrategy).id;
  }

  /**
   * Select a player from candidates using the given strategy.
   */
  private selectByStrategy(
    candidates: PlayerState[],
    strategy: TargetStrategy,
  ): PlayerState {
    switch (strategy) {
      case 'weakest':
        return candidates.reduce((best, cur) =>
          cur.hp < best.hp ||
          (cur.hp === best.hp && cur.handCards.length < best.handCards.length)
            ? cur
            : best,
        );

      case 'strongest':
        return candidates.reduce((best, cur) =>
          cur.hp > best.hp ||
          (cur.hp === best.hp && cur.handCards.length > best.handCards.length)
            ? cur
            : best,
        );

      case 'mostCards':
        return candidates.reduce((best, cur) =>
          cur.handCards.length > best.handCards.length ? cur : best,
        );

      case 'leastCards':
        return candidates.reduce((best, cur) =>
          cur.handCards.length < best.handCards.length ? cur : best,
        );

      default:
        return candidates[0]!;
    }
  }
}
