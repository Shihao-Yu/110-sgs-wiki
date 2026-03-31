/**
 * Types for QSanguosha (.qsgs) replay parsing.
 *
 * Replays capture a full game session: setup, turn-by-turn actions, and result.
 * The parser converts raw replay JSON into these typed structures, which can
 * then be mapped to engine GameEvent types for playback.
 */

import type { Faction } from '@sgs/data';

/** Top-level replay structure. */
export interface ReplayData {
  version: string;
  players: ReplayPlayer[];
  turns: ReplayTurn[];
  result: { winner: string; reason: string };
}

/** A player in the replay. */
export interface ReplayPlayer {
  id: string;
  name: string;
  seat: number;
  generals: { main: string; deputy: string };
  faction: Faction;
}

/** A single turn in the replay. */
export interface ReplayTurn {
  turnNumber: number;
  player: string;
  actions: ReplayAction[];
}

/** Discriminated union of all replay action types. */
export type ReplayAction =
  | { type: 'playCard'; card: string; targets: string[] }
  | { type: 'useSkill'; skill: string; targets: string[] }
  | { type: 'response'; card: string; to: string }
  | { type: 'damage'; from: string; to: string; amount: number }
  | { type: 'death'; player: string }
  | { type: 'drawCards'; player: string; count: number }
  | { type: 'discard'; player: string; cards: string[] };
