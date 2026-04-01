/**
 * SHU006 马超 — 铁骑 (Iron Cavalry)
 *
 * Passive skill. When your 杀 targets a player, perform a judgment
 * (flip a card from the draw pile). If the result is red (heart/diamond),
 * the target cannot use 闪 to dodge.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const RED_SUITS = new Set(['heart', 'diamond']);

export const tieqi: SkillPlugin = {
  id: 'tieqi',
  name: '铁骑',
  generalId: 'SHU006' as GeneralId,
  type: 'passive',
  description:
    'When your 杀 targets a player, flip a card — if red, the target cannot use 闪.',
  triggers: ['playCard'],

  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    if (ctx.event.card?.name !== '杀') return false;
    if (ctx.event.player !== ctx.player.id) return false;
    return ctx.game.drawPile.length > 0;
  },

  activate(ctx) {
    if (ctx.event.type !== 'playCard' || !ctx.event.targets) return;

    // Flip the top card of the draw pile as a judgment
    const judged = ctx.game.drawPile.shift();
    if (!judged) return;
    ctx.game.discardPile.push(judged);

    if (RED_SUITS.has(judged.suit)) {
      // Target cannot dodge — push an effect
      for (const targetId of ctx.event.targets) {
        ctx.game.activeEffects.push({
          id: `tieqi_${ctx.player.id}_${targetId}`,
          name: 'tieqi',
          sourcePlayerId: ctx.player.id,
          targetPlayerIds: [targetId],
          duration: 'phase',
          properties: { cannotDodge: true },
        });
      }
    }
  },
};
