/**
 * WU052 朱异 — 短术 (Duanshu / Limited Stratagem)
 * Active skill. Once per turn, you may discard a red card to let a player
 * draw 2 cards, then you lose 1 HP.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU052_GENERAL_ID = 'WU052' as GeneralId;

export const duanshu: SkillPlugin = {
  id: 'duanshu',
  name: '短术',
  generalId: WU052_GENERAL_ID,
  type: 'active',
  description: 'Discard a red card to let a player draw 2 cards; you lose 1 HP.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return (
      ctx.player.handCards.some(c => c.suit === 'heart' || c.suit === 'diamond') &&
      (ctx.player.marks['duanshu_used'] ?? 0) === 0
    );
  },
  activate(ctx) {
    if (ctx.event.type !== 'playCard') return;
    ctx.player.marks['duanshu_used'] = 1;
    const redCard = ctx.player.handCards.find(
      c => c.suit === 'heart' || c.suit === 'diamond',
    );
    if (redCard) {
      ctx.discardCards(ctx.player, [redCard]);
    }
    const targets = ctx.event.targets ?? [];
    const target = ctx.game.players.find(p => targets.includes(p.id));
    if (target) {
      ctx.drawCards(target, 2);
    }
    ctx.player.hp -= 1;
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.hp >= 3; },
    selectTargets(_ctx, candidates) { return candidates.slice(0, 1); },
  },
};
