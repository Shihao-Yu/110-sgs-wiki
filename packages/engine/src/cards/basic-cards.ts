/**
 * Basic card implementations: 杀 (Attack/Slash), 闪 (Dodge/Jink),
 * 桃 (Peach), 酒 (Wine).
 */

import type { Card } from '@sgs/data';
import type { GameState } from '../state/game.js';
import type { PlayerState } from '../state/player.js';
import type { PlayerId } from '../state/types.js';
import type { DamageManager } from '../damage/damage-manager.js';
import type { ResolutionStack } from '../resolution/resolution-stack.js';
import type { TargetSelector } from '../target/target-selector.js';
import type { CardPlayResult } from './types.js';

/**
 * 杀 (Slash/Attack): Target must play 闪 or take 1 damage.
 * Limited to 1 per turn unless modified by weapon or skill.
 */
export function playSlash(
  game: GameState,
  player: PlayerState,
  card: Card,
  target: PlayerId,
  slashCount: number,
  slashLimit: number,
  damageManager: DamageManager,
  stack: ResolutionStack,
  targetSelector: TargetSelector,
): CardPlayResult {
  // Enforce per-turn limit
  if (slashCount >= slashLimit) {
    return { success: false, reason: 'Slash limit reached for this turn' };
  }

  // Validate target in range
  const targetPlayer = game.players.find(p => p.id === target);
  if (!targetPlayer || !targetPlayer.alive) {
    return { success: false, reason: 'Invalid target' };
  }

  if (!targetSelector.isValidTarget(game, player, targetPlayer, card)) {
    return { success: false, reason: 'Target out of range' };
  }

  // Remove card from hand and push to discard
  removeCardFromHand(player, card);
  game.discardPile.push(card);

  // Push the play event onto resolution stack
  stack.push({
    type: 'playCard',
    player: player.id,
    card,
    targets: [target],
  });

  // Open a response window for the target to play 闪
  stack.openResponseWindow(target, { type: 'playCard', player: player.id, card, targets: [target] }, [
    { label: 'Play 闪 (Dodge)' },
    { label: 'Take damage' },
  ]);

  return { success: true };
}

/**
 * Resolve the target's response to 杀. Call after the response window closes.
 * If no 闪 was played, deal 1 damage.
 */
export function resolveSlashResponse(
  game: GameState,
  source: PlayerId,
  target: PlayerId,
  dodged: boolean,
  damageManager: DamageManager,
  sourceCard?: Card,
): void {
  if (!dodged) {
    damageManager.dealDamage(game, {
      source,
      target,
      amount: 1,
      card: sourceCard,
    });
  }
}

/**
 * 闪 (Dodge/Jink): Response-only card, cannot be played during the play phase.
 * Used in response to 杀 to avoid damage.
 */
export function playDodge(): CardPlayResult {
  return { success: false, reason: 'Dodge can only be used as a response' };
}

/**
 * 桃 (Peach): Recover 1 HP.
 * During play phase: self only, must be below max HP.
 * During dying: can be used on the dying player by anyone.
 */
export function playPeach(
  game: GameState,
  player: PlayerState,
  card: Card,
  target: PlayerId,
  damageManager: DamageManager,
  isDyingSave: boolean,
): CardPlayResult {
  const targetPlayer = game.players.find(p => p.id === target);
  if (!targetPlayer) {
    return { success: false, reason: 'Invalid target' };
  }

  // During play phase, peach can only target self
  if (!isDyingSave && target !== player.id) {
    return { success: false, reason: 'Peach can only target self during play phase' };
  }

  // Must be below max HP (or dying)
  if (!isDyingSave && targetPlayer.hp >= targetPlayer.maxHp) {
    return { success: false, reason: 'HP is already at maximum' };
  }

  // Target must be alive (or dying — still technically alive with HP <= 0)
  if (!targetPlayer.alive && !isDyingSave) {
    return { success: false, reason: 'Target is not alive' };
  }

  removeCardFromHand(player, card);
  game.discardPile.push(card);

  damageManager.recover(game, targetPlayer, 1);

  return { success: true };
}

/**
 * 酒 (Wine): Temporarily boost next 杀 damage by +1, or recover 1 HP when dying.
 * Limited to 1 per turn during play phase.
 */
export function playWine(
  game: GameState,
  player: PlayerState,
  card: Card,
  wineUsed: boolean,
  isDyingSave: boolean,
  damageManager: DamageManager,
): CardPlayResult {
  if (!isDyingSave && wineUsed) {
    return { success: false, reason: 'Wine already used this turn' };
  }

  removeCardFromHand(player, card);
  game.discardPile.push(card);

  if (isDyingSave) {
    // When dying, wine recovers 1 HP
    damageManager.recover(game, player, 1);
  } else {
    // Mark wine buff as an active effect for next slash
    game.activeEffects.push({
      id: `wine_${player.id}_${game.turnCount}`,
      name: 'wine',
      sourcePlayerId: player.id,
      targetPlayerIds: [player.id],
      duration: 'turn',
      properties: { damageBonus: 1 },
    });
  }

  return { success: true };
}

/** Remove a specific card from a player's hand by id. */
function removeCardFromHand(player: PlayerState, card: Card): void {
  const index = player.handCards.findIndex(c => c.id === card.id);
  if (index !== -1) {
    player.handCards.splice(index, 1);
  }
}
