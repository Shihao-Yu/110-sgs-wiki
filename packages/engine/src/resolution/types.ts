/**
 * Event types and response types for the resolution stack.
 */

import type { Card } from '@sgs/data';
import type { PhaseType, PlayerId } from '../state/types.js';

/** All game events that flow through the resolution stack. */
export type GameEvent =
  | { type: 'playCard'; player: PlayerId; card: Card; targets?: PlayerId[] }
  | { type: 'useSkill'; player: PlayerId; skillId: string; targets?: PlayerId[] }
  | { type: 'damage'; source?: PlayerId; target: PlayerId; amount: number; element?: 'fire' | 'thunder' }
  | { type: 'recover'; target: PlayerId; amount: number }
  | { type: 'drawCards'; player: PlayerId; count: number }
  | { type: 'discardCards'; player: PlayerId; cards: Card[] }
  | { type: 'loseHp'; player: PlayerId; amount: number }
  | { type: 'death'; player: PlayerId; killer?: PlayerId }
  | { type: 'phaseChange'; player: PlayerId; phase: PhaseType }
  | { type: 'response'; player: PlayerId; card?: Card; accepted: boolean };

/** An option presented to a player during a response window. */
export interface ResponseOption {
  label: string;
  card?: Card;
}

/** A player's response to a response window. */
export interface Response {
  accepted: boolean;
  card?: Card;
}

/** A pending response window waiting for player input. */
export interface ResponseWindow {
  player: PlayerId;
  event: GameEvent;
  options: ResponseOption[];
  response: Response | null;
}
