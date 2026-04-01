/**
 * WU032 全琮 — 翠微 (Cuiwei / Jade Subtlety)
 * Active skill. Once per turn during your play phase, you may discard 1
 * card to draw 2 cards.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU032_GENERAL_ID = 'WU032' as GeneralId;

export const cuiwei: SkillPlugin = {
  id: 'cuiwei',
  name: '翠微',
  generalId: WU032_GENERAL_ID,
  type: 'active',
  description: 'Once per turn, discard 1 card to draw 2 cards.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return (
      ctx.player.handCards.length > 0 &&
      (ctx.player.marks['cuiwei_used'] ?? 0) === 0
    );
  },
  activate(ctx) {
    ctx.player.marks['cuiwei_used'] = 1;
    if (ctx.player.handCards.length > 0) {
      ctx.discardCards(ctx.player, [ctx.player.handCards[0]!]);
    }
    ctx.drawCards(ctx.player, 2);
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.handCards.length >= 2; },
    selectTargets() { return []; },
  },
};
