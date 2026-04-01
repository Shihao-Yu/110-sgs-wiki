/**
 * WU045 吾粲 — 谊言 (Yiyan / Friendly Counsel)
 * Active skill. Once per turn during your play phase, you may discard 1
 * card and select a wounded player to recover 1 HP, then both of you draw
 * 1 card.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU045_GENERAL_ID = 'WU045' as GeneralId;

export const yiyan: SkillPlugin = {
  id: 'yiyan',
  name: '谊言',
  generalId: WU045_GENERAL_ID,
  type: 'active',
  description: 'Discard 1 card; a wounded player recovers 1 HP and both draw 1 card.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return (
      ctx.player.handCards.length > 0 &&
      (ctx.player.marks['yiyan_used'] ?? 0) === 0 &&
      ctx.game.players.some(p => p.alive && p.hp < p.maxHp)
    );
  },
  activate(ctx) {
    if (ctx.event.type !== 'playCard') return;
    ctx.player.marks['yiyan_used'] = 1;
    if (ctx.player.handCards.length > 0) {
      ctx.discardCards(ctx.player, [ctx.player.handCards[0]!]);
    }
    const wounded = ctx.game.players.find(
      p => p.alive && p.hp < p.maxHp && p.id !== ctx.player.id,
    );
    if (wounded) {
      wounded.hp += 1;
      ctx.drawCards(wounded, 1);
    }
    ctx.drawCards(ctx.player, 1);
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.handCards.length >= 2; },
    selectTargets(_ctx, candidates) { return candidates.slice(0, 1); },
  },
};
