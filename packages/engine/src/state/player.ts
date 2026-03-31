import type { Card, Faction, GeneralId, SkillId } from '@sgs/data';
import type { PlayerId } from './types.js';

/** A general assigned to a player (main or deputy slot). */
export interface GeneralSlot {
  generalId: GeneralId;
  revealed: boolean;
}

/** Equipment area — one slot per equipment subtype. */
export interface EquipmentSlots {
  weapon: Card | null;
  armor: Card | null;
  defensiveHorse: Card | null;
  offensiveHorse: Card | null;
  treasure: Card | null;
}

/** Complete state of a single player. */
export interface PlayerState {
  id: PlayerId;
  name: string;
  seat: number;

  /** Main general — null before assignment. */
  mainGeneral: GeneralSlot | null;
  /** Deputy general — null before assignment. */
  deputyGeneral: GeneralSlot | null;

  hp: number;
  maxHp: number;

  handCards: Card[];
  equipment: EquipmentSlots;
  /** Delayed trick cards pending resolution. */
  judgmentArea: Card[];

  /** Player's faction. null while hidden (Kingdom War concealed identity). */
  faction: Faction | null;
  alive: boolean;

  /** Active skill IDs derived from revealed generals. */
  skills: SkillId[];
  /** Named marks/tokens for skill tracking (e.g. "awakened": 1). */
  marks: Record<string, number>;
}
