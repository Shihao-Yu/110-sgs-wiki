/**
 * WU035 周鲂 — 断发 (Duanfa / Hair Cutting Oath)
 * Active skill. During your play phase, you may discard any number of
 * black-suited hand cards, then draw the same number of cards.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU035_GENERAL_ID = 'WU035' as GeneralId;

export const duanfa: SkillPlugin = {
  id: 'duanfa',
  name: '断发',
  generalId: WU035_GENERAL_ID,
  type: 'active',
  description: 'Discard any number of black-suited hand cards, then draw the same number.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return ctx.player.handCards.some(c => c.suit === 'spade' || c.suit === 'club');
  },
  activate(ctx) {
    const blackCards = ctx.player.handCards.filter(
      c => c.suit === 'spade' || c.suit === 'club',
    );
    if (blackCards.length === 0) return;
    ctx.discardCards(ctx.player, blackCards);
    ctx.drawCards(ctx.player, blackCards.length);
  },
  ai: {
    shouldActivate(ctx) {
      const blackCount = ctx.player.handCards.filter(
        c => c.suit === 'spade' || c.suit === 'club',
      ).length;
      return blackCount >= 2;
    },
    selectTargets() { return []; },
  },
};
