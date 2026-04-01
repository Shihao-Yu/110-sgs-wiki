/**
 * WU001 孙权 — 制衡 (Zhiheng / Balance)
 * Active skill. During your play phase, you may discard any number of cards
 * and draw the same number of cards.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU001_GENERAL_ID = 'WU001' as GeneralId;

export const zhiheng: SkillPlugin = {
  id: 'zhiheng',
  name: '制衡',
  generalId: WU001_GENERAL_ID,
  type: 'active',
  description:
    'During your play phase, you may discard any number of cards, then draw the same number of cards.',
  triggers: ['playCard'],

  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    // Must be the active player and have cards to discard
    const totalCards =
      ctx.player.handCards.length +
      Object.values(ctx.player.equipment).filter(Boolean).length;
    return totalCards > 0;
  },

  activate(ctx) {
    // Discard all hand cards, then draw the same count
    const cardsToDiscard = [...ctx.player.handCards];
    const count = cardsToDiscard.length;
    if (count === 0) return;

    ctx.discardCards(ctx.player, cardsToDiscard);
    ctx.drawCards(ctx.player, count);
  },

  ai: {
    shouldActivate(ctx) {
      // AI activates when hand is poor quality (few cards)
      return ctx.player.handCards.length <= 2 && ctx.player.handCards.length > 0;
    },
    selectTargets() {
      return [];
    },
  },
};
