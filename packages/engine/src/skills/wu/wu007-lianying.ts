/**
 * WU007 陆逊 — 连营 (Lianying / Chain Camp)
 * Passive skill. When you lose your last hand card, draw 1 card.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU007_GENERAL_ID = 'WU007' as GeneralId;

export const lianying: SkillPlugin = {
  id: 'lianying',
  name: '连营',
  generalId: WU007_GENERAL_ID,
  type: 'passive',
  description: 'When you lose your last hand card, draw 1 card.',
  triggers: ['discardCards'],

  canActivate(ctx) {
    if (ctx.event.type !== 'discardCards') return false;
    // Activates when the player just lost cards and now has 0 hand cards
    return ctx.event.player === ctx.player.id && ctx.player.handCards.length === 0;
  },

  activate(ctx) {
    ctx.drawCards(ctx.player, 1);
  },

  ai: {
    shouldActivate() {
      return true; // Always draw when last card is lost
    },
    selectTargets() {
      return [];
    },
  },
};
