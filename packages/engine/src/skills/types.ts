import type { Card, GeneralId, SkillType } from '@sgs/data';
import type { GameEvent } from '../resolution/types.js';
import type { GameState } from '../state/game.js';
import type { PlayerState } from '../state/player.js';

export type GameEventType = GameEvent['type'];

export interface SkillContext {
  game: GameState;
  player: PlayerState;
  event: GameEvent;
  drawCards(player: PlayerState, count: number): void;
  dealDamage(source: PlayerState, target: PlayerState, amount: number): void;
  discardCards(player: PlayerState, cards: Card[]): void;
  askForResponse(player: PlayerState, options: string[]): Promise<string>;
}

export interface SkillAiHints {
  shouldActivate(ctx: SkillContext): boolean;
  selectTargets(ctx: SkillContext, candidates: string[]): string[];
}

export interface SkillPlugin {
  id: string;
  name: string;
  generalId: GeneralId;
  type: SkillType;
  description: string;
  triggers: GameEventType[];
  priority?: number;
  canActivate(ctx: SkillContext): boolean;
  activate(ctx: SkillContext): void;
  ai?: SkillAiHints;
}
