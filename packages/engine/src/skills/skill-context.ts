import type { Card } from '@sgs/data';
import { DamageManager } from '../damage/damage-manager.js';
import { ResolutionStack } from '../resolution/resolution-stack.js';
import type { GameEvent } from '../resolution/types.js';
import type { GameState } from '../state/game.js';
import type { PlayerState, EquipmentSlots } from '../state/player.js';
import type { SkillContext } from './types.js';

export type SkillResponseHandler = (
  player: PlayerState,
  options: string[],
  context: { game: GameState; event: GameEvent },
) => Promise<string>;

export interface SkillContextFactoryOptions {
  game: GameState;
  player: PlayerState;
  event: GameEvent;
  stack?: ResolutionStack;
  askForResponse?: SkillResponseHandler;
}

const EQUIPMENT_SLOTS: (keyof EquipmentSlots)[] = [
  'weapon',
  'armor',
  'defensiveHorse',
  'offensiveHorse',
  'treasure',
];

export function createSkillContext(options: SkillContextFactoryOptions): SkillContext {
  const stack = options.stack ?? new ResolutionStack();
  const damageManager = new DamageManager(stack);
  const askForResponse =
    options.askForResponse ??
    (async () => {
      throw new Error('No response handler configured');
    });

  return {
    game: options.game,
    player: options.player,
    event: options.event,
    drawCards(player, count) {
      if (count <= 0 || !player.alive) return;

      const drawn = options.game.drawPile.splice(0, count);
      if (drawn.length === 0) return;

      player.handCards.push(...drawn);
      stack.push({
        type: 'drawCards',
        player: player.id,
        count: drawn.length,
      });
    },
    dealDamage(source, target, amount) {
      if (amount <= 0) return;

      damageManager.dealDamage(options.game, {
        source: source.id,
        target: target.id,
        amount,
      });
    },
    discardCards(player, cards) {
      if (cards.length === 0) return;

      const pendingIds = new Set(cards.map(card => card.id));
      const discarded: Card[] = [];

      player.handCards = player.handCards.filter((card) => {
        if (!pendingIds.delete(card.id)) {
          return true;
        }

        discarded.push(card);
        return false;
      });

      for (const slot of EQUIPMENT_SLOTS) {
        const equipped = player.equipment[slot];
        if (!equipped || !pendingIds.delete(equipped.id)) continue;

        discarded.push(equipped);
        player.equipment[slot] = null;
      }

      player.judgmentArea = player.judgmentArea.filter((card) => {
        if (!pendingIds.delete(card.id)) {
          return true;
        }

        discarded.push(card);
        return false;
      });

      if (discarded.length === 0) return;

      options.game.discardPile.push(...discarded);
      stack.push({
        type: 'discardCards',
        player: player.id,
        cards: discarded,
      });
    },
    askForResponse(player, responseOptions) {
      return askForResponse(player, responseOptions, {
        game: options.game,
        event: options.event,
      });
    },
  };
}
