import type { Faction, General, GeneralId, SkillId } from '@sgs/data';
import type { GameState } from '../state/game.js';
import type { GeneralSlot, PlayerState } from '../state/player.js';
import type { DualGeneralSetup } from './types.js';

export type GeneralRole = 'main' | 'deputy';
export type EffectiveFaction = Faction | 'unknown';

interface AssignedGeneral {
  slot: GeneralSlot;
  general: General;
}

/** Kingdom War dual-general state management. */
export class KingdomWarManager {
  private readonly generals = new Map<GeneralId, General>();

  /** Assign a concealed main/deputy pair and initialize HP/skills. */
  assignGenerals(player: PlayerState, main: General, deputy: General): void {
    this.registerGeneral(main);
    this.registerGeneral(deputy);

    player.mainGeneral = {
      generalId: main.id,
      revealed: false,
    };
    player.deputyGeneral = {
      generalId: deputy.id,
      revealed: false,
    };

    const dualHp = this.calculateDualHp(main, deputy);
    player.maxHp = dualHp;
    player.hp = dualHp;
    player.faction = null;
    player.alive = true;
    player.skills = [];
  }

  /** Combined HP uses the requested ceil-half formula for both generals. */
  calculateDualHp(main: General, deputy: General): number {
    return Math.ceil(main.hp / 2) + Math.ceil(deputy.hp / 2);
  }

  /** Reveal one general and activate its skills. */
  revealGeneral(
    _game: GameState,
    player: PlayerState,
    which: GeneralRole,
    generals?: { main: General; deputy: General },
  ): void {
    if (generals) {
      this.registerGeneral(generals.main);
      this.registerGeneral(generals.deputy);
    }

    const assigned = this.getAssignedGeneral(player, which);
    if (!assigned || assigned.slot.revealed) {
      return;
    }

    assigned.slot.revealed = true;

    if (player.faction === null) {
      player.faction = this.getFactionSource(player)?.faction ?? assigned.general.faction;
    }

    this.refreshSkills(player);
  }

  /** Returns whether the player's faction is publicly known. */
  isFactionRevealed(player: PlayerState): boolean {
    return this.getEffectiveFaction(player) !== 'unknown';
  }

  /** Faction stays unknown until one of the generals is revealed. */
  getEffectiveFaction(player: PlayerState): EffectiveFaction {
    if (player.faction !== null) {
      return player.faction;
    }

    const factionSource = this.getFactionSource(player);
    if (factionSource && this.isAnyGeneralRevealed(player)) {
      return factionSource.faction;
    }

    return 'unknown';
  }

  /** Allies are players with the same revealed faction. */
  areAllies(_game: GameState, p1: PlayerState, p2: PlayerState): boolean {
    const faction1 = this.getEffectiveFaction(p1);
    const faction2 = this.getEffectiveFaction(p2);

    return faction1 !== 'unknown' && faction1 === faction2;
  }

  /** Assign all players their concealed pairs and reset core game flags. */
  setupGame(
    game: GameState,
    playerGenerals: Map<string, [General, General]> | DualGeneralSetup[],
  ): void {
    const assignments = this.normalizeAssignments(playerGenerals);

    for (const player of game.players) {
      const generals = assignments.get(player.id);
      if (!generals) {
        throw new Error(`Missing general pair for player ${player.id}`);
      }

      this.assignGenerals(player, generals[0], generals[1]);
    }

    game.currentPlayerIndex = 0;
    game.currentPhase = 'prepare';
    game.turnCount = 1;
    game.activeEffects = [];
    game.gameOver = false;
    game.winnerFaction = null;
  }

  /** Hidden generals do not provide active skills until revealed. */
  canUseSkill(player: PlayerState, skillId: SkillId): boolean {
    return player.skills.includes(skillId);
  }

  /** First skill use from a hidden general automatically reveals that slot. */
  useSkill(
    game: GameState,
    player: PlayerState,
    which: GeneralRole,
    skillId: SkillId,
  ): boolean {
    const assigned = this.getAssignedGeneral(player, which);
    if (!assigned || !assigned.general.skills.includes(skillId)) {
      return false;
    }

    if (!assigned.slot.revealed) {
      this.revealGeneral(game, player, which);
    }

    return this.canUseSkill(player, skillId);
  }

  /** Remove a dead general slot and recalculate the survivor's state. */
  handleGeneralDeath(player: PlayerState, which: GeneralRole): void {
    const assigned = this.getAssignedGeneral(player, which);
    if (!assigned) {
      return;
    }

    if (which === 'main') {
      player.mainGeneral = player.deputyGeneral
        ? { ...player.deputyGeneral }
        : null;
      player.deputyGeneral = null;
    } else {
      player.deputyGeneral = null;
    }

    const remainingHp = this.calculateRemainingHp(player);
    player.maxHp = remainingHp;
    player.hp = Math.min(player.hp, remainingHp);

    if (remainingHp === 0) {
      player.hp = 0;
      player.alive = false;
      player.skills = [];
      return;
    }

    this.refreshSkills(player);
  }

  private registerGeneral(general: General): void {
    this.generals.set(general.id, general);
  }

  private getAssignedGeneral(player: PlayerState, which: GeneralRole): AssignedGeneral | null {
    const slot = which === 'main' ? player.mainGeneral : player.deputyGeneral;
    if (!slot) {
      return null;
    }

    const general = this.generals.get(slot.generalId);
    if (!general) {
      return null;
    }

    return { slot, general };
  }

  private getFactionSource(player: PlayerState): General | null {
    return this.getAssignedGeneral(player, 'main')?.general
      ?? this.getAssignedGeneral(player, 'deputy')?.general
      ?? null;
  }

  private isAnyGeneralRevealed(player: PlayerState): boolean {
    return Boolean(player.mainGeneral?.revealed || player.deputyGeneral?.revealed);
  }

  private calculateRemainingHp(player: PlayerState): number {
    const slots: GeneralRole[] = ['main', 'deputy'];

    return slots.reduce((total, which) => {
      const assigned = this.getAssignedGeneral(player, which);
      if (!assigned) {
        return total;
      }

      return total + Math.ceil(assigned.general.hp / 2);
    }, 0);
  }

  private refreshSkills(player: PlayerState): void {
    const activeSkills = new Set<SkillId>();

    const main = this.getAssignedGeneral(player, 'main');
    if (main?.slot.revealed) {
      for (const skillId of main.general.skills) {
        activeSkills.add(skillId);
      }
    }

    const deputy = this.getAssignedGeneral(player, 'deputy');
    if (deputy?.slot.revealed) {
      for (const skillId of deputy.general.skills) {
        activeSkills.add(skillId);
      }
    }

    player.skills = [...activeSkills];
  }

  private normalizeAssignments(
    playerGenerals: Map<string, [General, General]> | DualGeneralSetup[],
  ): Map<string, [General, General]> {
    if (playerGenerals instanceof Map) {
      return playerGenerals;
    }

    return new Map<string, [General, General]>(
      playerGenerals.map(entry => [entry.playerId, [entry.main, entry.deputy]]),
    );
  }
}
