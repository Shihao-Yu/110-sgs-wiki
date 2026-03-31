/**
 * Kingdom War (国战) specific types for dual-general identity mechanics.
 */

import type { Faction, General, GeneralId, SkillId } from '@sgs/data';
import type { PlayerId } from '../state/types.js';

/** Reveal state for a single general slot. */
export interface RevealState {
  generalId: GeneralId;
  revealed: boolean;
  /** Skills unlocked when this general is revealed. */
  skills: SkillId[];
}

/** Dual-general assignment for a single player in Kingdom War. */
export interface DualGeneralSetup {
  playerId: PlayerId;
  main: General;
  deputy: General;
}

/** Compact view of a player's Kingdom War identity state. */
export interface KingdomWarIdentity {
  mainRevealed: boolean;
  deputyRevealed: boolean;
  /** Faction visible to other players; null while both generals hidden. */
  revealedFaction: Faction | null;
}
