import type { Faction, General, GeneralId, SkillId } from '@sgs/data';
import type { GameState } from '../state/game.js';
import type { PlayerState } from '../state/player.js';
import type { KingdomWarManager } from './kingdom-war-manager.js';

/**
 * Descriptor for an emperor general and the leader-only skills that activate
 * when the player is revealed as the faction leader.
 */
export interface EmperorGeneral {
  generalId: GeneralId;
  name: string;
  faction: Faction;
  /** Skill IDs that only activate when this general is the faction leader. */
  leaderSkills: SkillId[];
}

/**
 * Manages the Emperor (主公) system for Kingdom War.
 *
 * In Kingdom War each faction has a designated emperor general whose
 * leader-only skills (主公技) activate when the player reveals as the first
 * member of that faction — effectively becoming the faction leader.
 */
export class EmperorManager {
  /** Official emperor generals keyed by GeneralId. */
  private readonly emperors = new Map<string, EmperorGeneral>();
  /** Track which faction already has a revealed leader. */
  private readonly factionLeaders = new Map<Faction, string>();

  constructor(private readonly kwManager: KingdomWarManager) {
    this.registerOfficialEmperors();
  }

  // -------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------

  /**
   * Whether the given GeneralId is an emperor general.
   */
  isEmperorGeneral(generalId: GeneralId): boolean {
    return this.emperors.has(generalId as string);
  }

  /**
   * Get the EmperorGeneral descriptor, or `null` if not an emperor.
   */
  getEmperorInfo(generalId: GeneralId): EmperorGeneral | null {
    return this.emperors.get(generalId as string) ?? null;
  }

  /**
   * Get the emperor general for a given faction, or `null`.
   */
  getEmperorForFaction(faction: Faction): EmperorGeneral | null {
    for (const emperor of this.emperors.values()) {
      if (emperor.faction === faction) {
        return emperor;
      }
    }
    return null;
  }

  /**
   * Returns all registered emperor generals.
   */
  getAllEmperors(): EmperorGeneral[] {
    return [...this.emperors.values()];
  }

  /**
   * Handle emperor reveal: when a player reveals an emperor general and is
   * the first member of that faction to reveal, they become the faction
   * leader and their leader-only skills are activated.
   *
   * Returns the list of newly activated leader skills, or an empty array if
   * the general is not an emperor or a leader already exists for the faction.
   */
  handleEmperorReveal(
    game: GameState,
    player: PlayerState,
  ): SkillId[] {
    const mainId = player.mainGeneral?.generalId;
    const deputyId = player.deputyGeneral?.generalId;

    // Check if either slot holds an emperor general
    const emperorId = this.findEmperorSlot(mainId, deputyId);
    if (!emperorId) {
      return [];
    }

    const emperor = this.emperors.get(emperorId as string);
    if (!emperor) {
      return [];
    }

    // The relevant slot must be revealed
    const slot = mainId === emperorId ? player.mainGeneral : player.deputyGeneral;
    if (!slot?.revealed) {
      return [];
    }

    // Only the first revealer for this faction becomes leader
    const faction = emperor.faction;
    if (this.factionLeaders.has(faction)) {
      return [];
    }

    // Register as faction leader
    this.factionLeaders.set(faction, player.id);

    // Activate leader-only skills
    const newSkills = emperor.leaderSkills.filter(
      (skillId) => !player.skills.includes(skillId),
    );

    player.skills.push(...newSkills);

    return newSkills;
  }

  /**
   * Whether this player is the recognised faction leader.
   */
  isFactionLeader(player: PlayerState, faction: Faction): boolean {
    return this.factionLeaders.get(faction) === player.id;
  }

  /**
   * Get the player id of the faction leader, or `null`.
   */
  getFactionLeader(faction: Faction): string | null {
    return this.factionLeaders.get(faction) ?? null;
  }

  /**
   * Register an additional emperor general at runtime.
   */
  registerEmperor(emperor: EmperorGeneral): void {
    this.emperors.set(emperor.generalId as string, emperor);
  }

  // -------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------

  private findEmperorSlot(
    mainId: GeneralId | undefined,
    deputyId: GeneralId | undefined,
  ): GeneralId | null {
    if (mainId && this.emperors.has(mainId as string)) {
      return mainId;
    }
    if (deputyId && this.emperors.has(deputyId as string)) {
      return deputyId;
    }
    return null;
  }

  /**
   * Register the four canonical emperor generals from official rules.
   *
   * Each faction (WEI, SHU, WU, QUN) has exactly one emperor general with
   * at least one leader-only skill (主公技).
   */
  private registerOfficialEmperors(): void {
    const emperors: EmperorGeneral[] = [
      {
        generalId: 'liubei' as GeneralId,
        name: '刘备',
        faction: 'SHU',
        leaderSkills: ['jijiang' as SkillId],
      },
      {
        generalId: 'sunquan' as GeneralId,
        name: '孙权',
        faction: 'WU',
        leaderSkills: ['jiuyuan' as SkillId],
      },
      {
        generalId: 'caocao' as GeneralId,
        name: '曹操',
        faction: 'WEI',
        leaderSkills: ['hujia' as SkillId],
      },
      {
        generalId: 'zhangjiao' as GeneralId,
        name: '张角',
        faction: 'QUN',
        leaderSkills: ['huangtian' as SkillId],
      },
    ];

    for (const emperor of emperors) {
      this.registerEmperor(emperor);
    }
  }
}
