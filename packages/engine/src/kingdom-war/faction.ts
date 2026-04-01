import type { Faction } from '@sgs/data';
import type { GameState } from '../state/game.js';
import type { PlayerState } from '../state/player.js';
import type { KingdomWarManager, EffectiveFaction } from './kingdom-war-manager.js';

/**
 * Kingdom War faction alliance detection and victory condition evaluation.
 *
 * Victory rule: when every alive player shares the same *revealed* faction,
 * that faction wins. Hidden (unrevealed) players are treated as a distinct
 * "unknown" faction, so they block a faction victory until they reveal.
 */
export class FactionManager {
  constructor(private readonly kwManager: KingdomWarManager) {}

  /**
   * Returns the faction alliance this player belongs to, or `'unknown'`
   * while neither general has been revealed.
   */
  detectFactionAlliance(
    _game: GameState,
    player: PlayerState,
  ): EffectiveFaction {
    return this.kwManager.getEffectiveFaction(player);
  }

  /**
   * All alive players whose revealed faction matches `faction`.
   * Only publicly-known factions are considered (hidden players excluded).
   */
  getFactionMembers(game: GameState, faction: Faction): PlayerState[] {
    return game.players.filter(
      (p) =>
        p.alive && this.kwManager.getEffectiveFaction(p) === faction,
    );
  }

  /**
   * Evaluate the Kingdom War victory condition.
   *
   * Returns the winning `Faction` when **all** alive players share the same
   * revealed faction. Hidden players count as faction `'unknown'`, so they
   * prevent any faction from claiming victory.
   *
   * Returns `null` when no single faction has won yet.
   */
  checkVictoryCondition(game: GameState): Faction | null {
    const alivePlayers = game.players.filter((p) => p.alive);

    if (alivePlayers.length === 0) {
      return null;
    }

    const factions = new Set<EffectiveFaction>();
    for (const player of alivePlayers) {
      factions.add(this.kwManager.getEffectiveFaction(player));
    }

    // Multiple factions alive (including 'unknown') — no winner yet.
    if (factions.size !== 1) {
      return null;
    }

    const sole = [...factions][0];

    // If the only alive players are all hidden, nobody has won.
    if (sole === 'unknown') {
      return null;
    }

    return sole;
  }

  /**
   * Whether `source` may target `target` under Kingdom War cross-faction
   * targeting rules.
   *
   * - Allies (same revealed faction) may **not** target each other with
   *   hostile actions.
   * - If either player's faction is unknown, hostile targeting is allowed
   *   (conservative: you don't know they're on your side).
   */
  canTargetHostile(
    game: GameState,
    source: PlayerState,
    target: PlayerState,
  ): boolean {
    return !this.kwManager.areAllies(game, source, target);
  }
}
