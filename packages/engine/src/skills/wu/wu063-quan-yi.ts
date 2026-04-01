/**
 * WU063 全怿 — 瑰藻 (Guizao / Ornate Prose)
 * Active skill. Once per turn, you may discard 2 cards of different suits
 * to draw 3 cards.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU063_GENERAL_ID = 'WU063' as GeneralId;

export const guizao: SkillPlugin = {
  id: 'guizao',
  name: '瑰藻',
  generalId: WU063_GENERAL_ID,
  type: 'active',
  description: 'Discard 2 cards of different suits to draw 3 cards.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    if ((ctx.player.marks['guizao_used'] ?? 0) !== 0) return false;
    if (ctx.player.handCards.length < 2) return false;
    const suits = new Set(ctx.player.handCards.map(c => c.suit));
    return suits.size >= 2;
  },
  activate(ctx) {
    ctx.player.marks['guizao_used'] = 1;
    if (ctx.player.handCards.length >= 2) {
      // Take 2 cards of different suits
      const first = ctx.player.handCards[0]!;
      const second = ctx.player.handCards.find(c => c.suit !== first.suit);
      if (second) {
        ctx.discardCards(ctx.player, [first, second]);
        ctx.drawCards(ctx.player, 3);
      }
    }
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.handCards.length >= 3; },
    selectTargets() { return []; },
  },
};
