/**
 * Kingdom War (国战) manager — dual-general assignment, HP calculation,
 * reveal mechanics, and faction-based ally detection.
 *
 * In Kingdom War each player receives two generals (main + deputy).
 * Both start face-down. Revealing a general exposes the player's faction
 * and unlocks that general's skills. HP is calculated as
 * ceil(mainHp / 2) + ceil(deputyHp / 2).
 */

import type { Faction, General, SkillId } from '@sgs/data';
import type { GameState } from '../state/game.js';
import type { PlayerState } from '../state/player.js';
import type { PlayerId } from '../state/types.js';
import type { DualGeneralSetup } from './types.js';

export class KingdomWarManager {
  /**
   * Assign a main and deputy general to a player.
   * Both generals start hidden; skills are not yet active.
   */
  assignGenerals(player: PlayerState, main: General, deputy: General): void {
    player.mainGeneral = { generalId: main.id, revealed: false };
    player.deputyGeneral = { generalId: deputy.id, revealed: false };

    const hp = this.calculateDualHp(main, deputy);
    player.hp = hp;
    player.maxHp = hp;

    // Faction stays hidden until a general is revealed.
    player.faction = null;
    // No skills active while both generals are hidden.
    player.skills = [];
  }

  /**
   * Kingdom War HP formula: ceil(mainHp / 2) + ceil(deputyHp / 2).
   */
  calculateDualHp(main: General, deputy: General): number {
    return Math.ceil(main.hp / 2) + Math.ceil(deputy.hp / 2);
  }

  /**
   * Reveal a player's main or deputy general.
   * - Exposes the player's faction (from the main general).
   * - Unlocks that general's skills.
   */
  revealGeneral(
    _game: GameState,
    player: PlayerState,
    slot: 'main' | 'deputy',
    generals: { main: General; deputy: General },
  ): void {
    const generalSlot = slot === 'main' ? player.mainGeneral : player.deputyGeneral;
    if (!generalSlot || generalSlot.revealed) return;

    generalSlot.revealed = true;

    // Unlock the revealed general's skills.
    const general = slot === 'main' ? generals.main : generals.deputy;
    const newSkills: SkillId[] = general.skills.filter(
      (s: SkillId) => !player.skills.includes(s),
    );
    player.skills.push(...newSkills);

    // Reveal faction (derived from the main general's faction).
    // Once any general is revealed, the player's faction becomes known.
    player.faction = generals.main.faction;
  }

  /** Whether the player's faction has been revealed (at least one general face-up). */
  isFactionRevealed(player: PlayerState): boolean {
    const mainRevealed = player.mainGeneral?.revealed ?? false;
    const deputyRevealed = player.deputyGeneral?.revealed ?? false;
    return mainRevealed || deputyRevealed;
  }

  /**
   * Get the faction visible to other players.
   * Returns the faction if revealed, otherwise 'unknown'.
   */
  getEffectiveFaction(player: PlayerState): Faction | 'unknown' {
    if (this.isFactionRevealed(player) && player.faction) {
      return player.faction;
    }
    return 'unknown';
  }

  /**
   * Check if two players are allies (same revealed faction).
   * Both players must have their faction revealed; hidden players
   * are never considered allies.
   */
  areAllies(_game: GameState, p1: PlayerState, p2: PlayerState): boolean {
    const f1 = this.getEffectiveFaction(p1);
    const f2 = this.getEffectiveFaction(p2);
    if (f1 === 'unknown' || f2 === 'unknown') return false;
    return f1 === f2;
  }

  /**
   * Initialize a full Kingdom War game: assign dual generals to every player.
   */
  setupGame(_game: GameState, playerGenerals: DualGeneralSetup[]): void {
    for (const pg of playerGenerals) {
      const player = _game.players.find(p => p.id === pg.playerId);
      if (player) {
        this.assignGenerals(player, pg.main, pg.deputy);
      }
    }
  }
}
