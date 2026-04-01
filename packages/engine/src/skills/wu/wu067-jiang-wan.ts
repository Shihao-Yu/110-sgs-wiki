/**
 * WU067 蒋琬 — 承业 (Chengye / Inherit the Cause)
 * Passive skill. When another player dies, you may draw 2 cards and
 * recover 1 HP.
 *
 * 峻义 (Junyi / Strict Righteousness)
 * Limited skill. Once per game, during your turn, you may show your hand.
 * For each suit represented, you draw 1 card.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU067_GENERAL_ID = 'WU067' as GeneralId;

export const chengye: SkillPlugin = {
  id: 'chengye',
  name: '承业',
  generalId: WU067_GENERAL_ID,
  type: 'passive',
  description: 'When another player dies, draw 2 cards and recover 1 HP.',
  triggers: ['death'],
  canActivate(ctx) {
    if (ctx.event.type !== 'death') return false;
    return ctx.event.player !== ctx.player.id;
  },
  activate(ctx) {
    ctx.drawCards(ctx.player, 2);
    if (ctx.player.hp < ctx.player.maxHp) {
      ctx.player.hp += 1;
    }
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};

export const junyi: SkillPlugin = {
  id: 'junyi',
  name: '峻义',
  generalId: WU067_GENERAL_ID,
  type: 'limited',
  description: 'Once per game, show hand and draw 1 card per suit represented.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return (
      ctx.event.player === ctx.player.id &&
      ctx.player.handCards.length > 0 &&
      (ctx.player.marks['junyi_used'] ?? 0) === 0
    );
  },
  activate(ctx) {
    ctx.player.marks['junyi_used'] = 1;
    const suits = new Set(ctx.player.handCards.map(c => c.suit));
    ctx.drawCards(ctx.player, suits.size);
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.handCards.length >= 3; },
    selectTargets() { return []; },
  },
};
