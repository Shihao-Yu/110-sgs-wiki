/**
 * Core engine types for game state identification and phases.
 */

/** Unique identifier for a player in a game session. */
export type PlayerId = string & { readonly __brand: 'PlayerId' };

/** Phases within a player's turn, in order. */
export type PhaseType =
  | 'prepare'
  | 'judgment'
  | 'draw'
  | 'play'
  | 'discard'
  | 'end';
