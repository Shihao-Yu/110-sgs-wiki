/**
 * Damage chain system: source → DamageEvent → triggers → HP change → death check → rewards/penalties.
 *
 * Handles damage application, chain damage (铁索连环) propagation,
 * death resolution with Kingdom War reward/penalty rules.
 */

import type { Card } from '@sgs/data';
import type { GameState } from '../state/game.js';
import type { PlayerState, EquipmentSlots } from '../state/player.js';
import type { PlayerId } from '../state/types.js';
import type { ResolutionStack } from '../resolution/resolution-stack.js';

/** Damage event with full source tracking. */
export interface DamageEvent {
  source?: PlayerId;
  target: PlayerId;
  amount: number;
  element?: 'fire' | 'thunder';
  card?: Card;
  isChainDamage?: boolean;
}

export class DamageManager {
  private stack: ResolutionStack;

  constructor(stack: ResolutionStack) {
    this.stack = stack;
  }

  /** Apply damage to a player, propagate chains, check death. */
  dealDamage(game: GameState, event: DamageEvent): void {
    const target = game.players.find(p => p.id === event.target);
    if (!target || !target.alive) return;

    // Reduce HP
    target.hp -= event.amount;

    // Push damage event onto stack for trigger tracking
    this.stack.push({
      type: 'damage',
      source: event.source,
      target: event.target,
      amount: event.amount,
      element: event.element,
    });

    // Chain damage propagation (铁索连环):
    // When a chained player takes elemental damage, propagate to all other chained players.
    if (event.element && target.marks['chained'] && !event.isChainDamage) {
      target.marks['chained'] = 0;
      this.propagateChainDamage(game, event, target);
    } else if (event.isChainDamage && target.marks['chained']) {
      target.marks['chained'] = 0;
    }

    // Check death
    if (this.checkDeath(game, target)) {
      const killer = event.source
        ? game.players.find(p => p.id === event.source)
        : undefined;
      this.resolveDeath(game, target, killer);
    }
  }

  /** Check if a player should die (HP <= 0 and still alive). */
  checkDeath(_game: GameState, player: PlayerState): boolean {
    return player.alive && player.hp <= 0;
  }

  /** Recover HP for a player, capped at maxHp. */
  recover(_game: GameState, player: PlayerState, amount: number): void {
    if (!player.alive) return;
    player.hp = Math.min(player.hp + amount, player.maxHp);
    this.stack.push({
      type: 'recover',
      target: player.id,
      amount,
    });
  }

  /** Process death: mark dead, push death event, handle Kingdom War rewards/penalties. */
  resolveDeath(game: GameState, dead: PlayerState, killer?: PlayerState): void {
    dead.alive = false;

    this.stack.push({
      type: 'death',
      player: dead.id,
      killer: killer?.id,
    });

    if (!killer) return;

    // Kingdom War reward/penalty rules
    if (dead.faction && killer.faction) {
      if (killer.faction === dead.faction) {
        // Same-faction kill: killer discards entire hand + all equipment
        game.discardPile.push(...killer.handCards);
        killer.handCards = [];

        const slots: (keyof EquipmentSlots)[] = [
          'weapon', 'armor', 'defensiveHorse', 'offensiveHorse', 'treasure',
        ];
        for (const slot of slots) {
          if (killer.equipment[slot]) {
            game.discardPile.push(killer.equipment[slot]!);
            killer.equipment[slot] = null;
          }
        }
      } else {
        // Cross-faction kill: killer draws 3 cards
        const drawn = game.drawPile.splice(0, 3);
        killer.handCards.push(...drawn);
        this.stack.push({
          type: 'drawCards',
          player: killer.id,
          count: drawn.length,
        });
      }
    }
  }

  /** Propagate chain damage to all other chained, alive players (seat order from damaged player). */
  private propagateChainDamage(
    game: GameState,
    originalEvent: DamageEvent,
    damagedPlayer: PlayerState,
  ): void {
    const chainedPlayers = game.players.filter(
      p => p.alive && p.id !== damagedPlayer.id && p.marks['chained'],
    );

    for (const chained of chainedPlayers) {
      this.dealDamage(game, {
        source: originalEvent.source,
        target: chained.id,
        amount: originalEvent.amount,
        element: originalEvent.element,
        isChainDamage: true,
      });
    }
  }
}
