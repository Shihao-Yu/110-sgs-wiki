/**
 * SHU002 关羽 — 武圣 (Martial Saint)
 *
 * Passive skill. You may use any red-suited card (heart / diamond) as 杀 (Slash).
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

/** Red suits that qualify for conversion. */
const RED_SUITS = new Set(['heart', 'diamond']);

export const wusheng: SkillPlugin = {
  id: 'wusheng',
  name: '武圣',
  generalId: 'SHU002' as GeneralId,
  type: 'passive',
  description: 'You may use any red-suited card (heart/diamond) as 杀 (Slash).',
  triggers: ['playCard'],

  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;

    // Player has at least one red card in hand
    return ctx.player.handCards.some((card) => RED_SUITS.has(card.suit));
  },

  activate(ctx) {
    if (ctx.event.type !== 'playCard') return;

    // Find the first red card in hand and treat it as a Slash
    const redCard = ctx.player.handCards.find((card) => RED_SUITS.has(card.suit));
    if (!redCard) return;

    // Mark this card as being used as 杀 via an active effect
    ctx.game.activeEffects.push({
      id: `wusheng_${ctx.player.id}_${redCard.id}`,
      name: 'wusheng',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: [ctx.player.id],
      duration: 'phase',
      properties: {
        convertedCardId: redCard.id,
        treatedAs: '杀',
      },
    });
  },
};
