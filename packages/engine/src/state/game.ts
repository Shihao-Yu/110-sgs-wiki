import type { Card, Faction } from '@sgs/data';
import type { PlayerState } from './player.js';
import type { PhaseType, PlayerId } from './types.js';

/** A runtime effect or modifier active on the game state. */
export interface ActiveEffect {
  id: string;
  name: string;
  sourcePlayerId: PlayerId;
  targetPlayerIds: PlayerId[];
  duration: 'turn' | 'phase' | 'permanent';
  properties: Record<string, string | number | boolean>;
}

/** Complete game state — fully serializable via JSON round-trip. */
export interface GameState {
  players: PlayerState[];
  drawPile: Card[];
  discardPile: Card[];
  currentPlayerIndex: number;
  currentPhase: PhaseType;
  turnCount: number;
  activeEffects: ActiveEffect[];
  gameOver: boolean;
  winnerFaction: Faction | null;
}
