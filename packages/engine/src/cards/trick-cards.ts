/**
 * Trick card implementations: 无中生有 (Draw 2), 过河拆桥 (Dismantle),
 * 顺手牵羊 (Snatch).
 */

import type { Card } from '@sgs/data';
import type { GameState } from '../state/game.js';
import type { PlayerState } from '../state/player.js';
import type { PlayerId } from '../state/types.js';
import type { ResolutionStack } from '../resolution/resolution-stack.js';
import type { TargetSelector } from '../target/target-selector.js';
import type { CardPlayResult } from './types.js';

/**
 * 无中生有 (Something for Nothing / Draw 2): Draw 2 cards from the draw pile.
 * Targets self only.
 */
export function playDrawTwo(
  game: GameState,
  player: PlayerState,
  card: Card,
  stack: ResolutionStack,
): CardPlayResult {
  // Remove card from hand and discard
  removeCardFromHand(player, card);
  game.discardPile.push(card);

  // Draw 2 cards
  const drawn = game.drawPile.splice(0, 2);
  player.handCards.push(...drawn);

  stack.push({
    type: 'playCard',
    player: player.id,
    card,
  });

  stack.push({
    type: 'drawCards',
    player: player.id,
    count: drawn.length,
  });

  return { success: true };
}

/**
 * 过河拆桥 (Dismantle): Choose and discard one card from a target player
 * (hand or equipment). The card goes to the discard pile.
 */
export function playDismantle(
  game: GameState,
  player: PlayerState,
  card: Card,
  target: PlayerId,
  selectedCard: Card,
  stack: ResolutionStack,
  targetSelector: TargetSelector,
): CardPlayResult {
  const targetPlayer = game.players.find(p => p.id === target);
  if (!targetPlayer || !targetPlayer.alive) {
    return { success: false, reason: 'Invalid target' };
  }

  if (target === player.id) {
    return { success: false, reason: 'Cannot target self with Dismantle' };
  }

  if (!targetSelector.isValidTarget(game, player, targetPlayer, card)) {
    return { success: false, reason: 'Target is not valid' };
  }

  // Target must have cards to dismantle
  if (targetPlayer.handCards.length === 0 && !hasEquipment(targetPlayer)) {
    return { success: false, reason: 'Target has no cards to discard' };
  }

  // Remove trick card from hand
  removeCardFromHand(player, card);
  game.discardPile.push(card);

  // Remove the selected card from target
  const removed = removeCardFromPlayer(targetPlayer, selectedCard);
  if (removed) {
    game.discardPile.push(removed);
  }

  stack.push({
    type: 'playCard',
    player: player.id,
    card,
    targets: [target],
  });

  stack.push({
    type: 'discardCards',
    player: target,
    cards: removed ? [removed] : [],
  });

  return { success: true };
}

/**
 * 顺手牵羊 (Snatch): Take one card from a target player (hand or equipment)
 * and add it to your own hand. Target must be within distance 1.
 */
export function playSnatch(
  game: GameState,
  player: PlayerState,
  card: Card,
  target: PlayerId,
  selectedCard: Card,
  stack: ResolutionStack,
  targetSelector: TargetSelector,
): CardPlayResult {
  const targetPlayer = game.players.find(p => p.id === target);
  if (!targetPlayer || !targetPlayer.alive) {
    return { success: false, reason: 'Invalid target' };
  }

  if (target === player.id) {
    return { success: false, reason: 'Cannot target self with Snatch' };
  }

  // Snatch requires distance <= 1
  const distance = targetSelector.getDistance(game, player, targetPlayer);
  if (distance > 1) {
    return { success: false, reason: 'Target out of range (distance must be 1)' };
  }

  // Target must have cards
  if (targetPlayer.handCards.length === 0 && !hasEquipment(targetPlayer)) {
    return { success: false, reason: 'Target has no cards to take' };
  }

  // Remove trick card from hand
  removeCardFromHand(player, card);
  game.discardPile.push(card);

  // Remove the selected card from target and give to player
  const removed = removeCardFromPlayer(targetPlayer, selectedCard);
  if (removed) {
    player.handCards.push(removed);
  }

  stack.push({
    type: 'playCard',
    player: player.id,
    card,
    targets: [target],
  });

  return { success: true };
}

/** Check whether a player has any equipment cards. */
function hasEquipment(player: PlayerState): boolean {
  return !!(
    player.equipment.weapon ||
    player.equipment.armor ||
    player.equipment.defensiveHorse ||
    player.equipment.offensiveHorse ||
    player.equipment.treasure
  );
}

/**
 * Remove a card from a player's hand or equipment area.
 * Returns the removed card, or undefined if not found.
 */
function removeCardFromPlayer(player: PlayerState, card: Card): Card | undefined {
  // Try hand first
  const handIdx = player.handCards.findIndex(c => c.id === card.id);
  if (handIdx !== -1) {
    return player.handCards.splice(handIdx, 1)[0];
  }

  // Try equipment slots
  const slots = ['weapon', 'armor', 'defensiveHorse', 'offensiveHorse', 'treasure'] as const;
  for (const slot of slots) {
    if (player.equipment[slot]?.id === card.id) {
      const removed = player.equipment[slot]!;
      player.equipment[slot] = null;
      return removed;
    }
  }

  return undefined;
}

/** Remove a specific card from a player's hand by id. */
function removeCardFromHand(player: PlayerState, card: Card): void {
  const index = player.handCards.findIndex(c => c.id === card.id);
  if (index !== -1) {
    player.handCards.splice(index, 1);
  }
}
