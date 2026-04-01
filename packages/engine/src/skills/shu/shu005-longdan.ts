/**
 * SHU005 赵云 — 龙胆 (Dragon Heart)
 *
 * Passive skill. You may use 杀 as 闪, and use 闪 as 杀.
 * Implemented by adding an active effect that the card-play layer can
 * check for conversion eligibility.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const longdan: SkillPlugin = {
  id: 'longdan',
  name: '龙胆',
  generalId: 'SHU005' as GeneralId,
  type: 'passive',
  description: 'You may use 杀 as 闪, and use 闪 as 杀.',
  triggers: ['playCard', 'response'],

  canActivate(ctx) {
    if (ctx.event.type === 'playCard' || ctx.event.type === 'response') {
      // Has a 杀 or 闪 in hand
      return ctx.player.handCards.some(
        (card) => card.name === '杀' || card.name === '闪',
      );
    }
    return false;
  },

  activate(ctx) {
    ctx.game.activeEffects.push({
      id: `longdan_${ctx.player.id}_${ctx.game.turnCount}`,
      name: 'longdan',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: [ctx.player.id],
      duration: 'phase',
      properties: {
        slashAsDodge: true,
        dodgeAsSlash: true,
      },
    });
  },
};
