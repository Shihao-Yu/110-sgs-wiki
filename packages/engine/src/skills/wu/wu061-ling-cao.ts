/**
 * WU061 凌操 — 旋锋 (Xuanfeng / Whirlwind, alt)
 * Passive skill. When you discard cards during the discard phase, you
 * may deal 1 damage to a player for each card discarded.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU061_GENERAL_ID = 'WU061' as GeneralId;

export const xuanfengAlt: SkillPlugin = {
  id: 'xuanfengAlt',
  name: '旋锋',
  generalId: WU061_GENERAL_ID,
  type: 'passive',
  description: 'When discarding in discard phase, deal 1 damage per card discarded.',
  triggers: ['discardCards'],
  canActivate(ctx) {
    if (ctx.event.type !== 'discardCards') return false;
    return ctx.event.player === ctx.player.id;
  },
  activate(ctx) {
    if (ctx.event.type !== 'discardCards') return;
    const cards = ctx.event.cards;
    const targets = ctx.game.players.filter(
      p => p.id !== ctx.player.id && p.alive,
    );
    const target = targets[0];
    if (target && cards.length > 0) {
      ctx.dealDamage(ctx.player, target, 1);
    }
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets(_ctx, candidates) { return candidates.slice(0, 1); },
  },
};
