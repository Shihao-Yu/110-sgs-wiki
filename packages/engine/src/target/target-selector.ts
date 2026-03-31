import type { Card } from '@sgs/data';
import type { GameState } from '../state/game.js';
import type { PlayerState } from '../state/player.js';

/** Default attack range when no weapon is equipped. */
const DEFAULT_ATTACK_RANGE = 1;

/**
 * Handles target selection: circular distance calculation,
 * horse modifiers, weapon range, and valid-target checks.
 */
export class TargetSelector {
  /**
   * Calculate distance between two players on a circular table.
   * Only alive players occupy seats for distance purposes.
   * Defensive horse on target adds +1; offensive horse on attacker subtracts -1.
   * Minimum distance is always 1.
   */
  getDistance(game: GameState, from: PlayerState, to: PlayerState): number {
    if (from.id === to.id) return 0;

    const alive = game.players.filter((p) => p.alive);
    alive.sort((a, b) => a.seat - b.seat);

    const fromIdx = alive.findIndex((p) => p.id === from.id);
    const toIdx = alive.findIndex((p) => p.id === to.id);
    if (fromIdx === -1 || toIdx === -1) return Infinity;

    const n = alive.length;
    const clockwise = (toIdx - fromIdx + n) % n;
    const counterClockwise = (fromIdx - toIdx + n) % n;
    let distance = Math.min(clockwise, counterClockwise);

    // Defensive horse on target increases distance
    if (to.equipment.defensiveHorse) {
      distance += 1;
    }

    // Offensive horse on attacker decreases distance
    if (from.equipment.offensiveHorse) {
      distance -= 1;
    }

    return Math.max(distance, 1);
  }

  /** Get the attack range for a player (weapon range or default 1). */
  getAttackRange(player: PlayerState): number {
    const weapon = player.equipment.weapon;
    if (weapon && weapon.range != null) {
      return weapon.range;
    }
    return DEFAULT_ATTACK_RANGE;
  }

  /** Get all alive players the attacker can reach with 杀 (Slash). */
  getAttackTargets(game: GameState, attacker: PlayerState): PlayerState[] {
    const range = this.getAttackRange(attacker);
    return game.players.filter(
      (p) =>
        p.alive &&
        p.id !== attacker.id &&
        this.getDistance(game, attacker, p) <= range,
    );
  }

  /**
   * Get valid targets for a trick card.
   * - Instant tricks: any alive player except self.
   * - Delayed tricks: any alive player except self.
   */
  getTrickTargets(game: GameState, player: PlayerState, _card: Card): PlayerState[] {
    return game.players.filter((p) => p.alive && p.id !== player.id);
  }

  /** Check if a specific player is a valid target for a card. */
  isValidTarget(
    game: GameState,
    from: PlayerState,
    to: PlayerState,
    card: Card,
  ): boolean {
    if (!to.alive || from.id === to.id) return false;

    if (card.type === 'basic' && card.name === '杀') {
      const range = this.getAttackRange(from);
      return this.getDistance(game, from, to) <= range;
    }

    // Trick cards: any alive player except self
    return true;
  }
}
