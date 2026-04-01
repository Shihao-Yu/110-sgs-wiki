/**
 * WU029 朱据 — 义举 (Yiju / Righteous Gesture)
 * Active skill. Once per turn during your play phase, if your hand is empty,
 * you may draw 1 card from every other player and then discard half (round down).
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU029_GENERAL_ID = 'WU029' as GeneralId;

export const yiju: SkillPlugin = {
  id: 'yiju',
  name: '义举',
  generalId: WU029_GENERAL_ID,
  type: 'active',
  description: 'If your hand is empty, draw 1 card from each other player, then discard half.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return (
      ctx.player.handCards.length === 0 &&
      (ctx.player.marks['yiju_used'] ?? 0) === 0
    );
  },
  activate(ctx) {
    ctx.player.marks['yiju_used'] = 1;
    // Simplified: draw 1 card per other alive player
    const otherCount = ctx.game.players.filter(
      p => p.alive && p.id !== ctx.player.id,
    ).length;
    ctx.drawCards(ctx.player, otherCount);
    // Discard half (round down)
    const toDiscard = Math.floor(ctx.player.handCards.length / 2);
    if (toDiscard > 0) {
      ctx.discardCards(ctx.player, ctx.player.handCards.slice(0, toDiscard));
    }
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.handCards.length === 0; },
    selectTargets() { return []; },
  },
};
