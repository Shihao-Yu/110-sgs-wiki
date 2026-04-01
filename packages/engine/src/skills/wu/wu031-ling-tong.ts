/**
 * WU031 凌统 — 旋风 (Xuanfeng / Whirlwind)
 * Passive skill. When you lose an equipment card or discard cards during
 * the discard phase, you may choose up to 2 other players: one discards a
 * card, the other takes 1 damage.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU031_GENERAL_ID = 'WU031' as GeneralId;

export const xuanfeng: SkillPlugin = {
  id: 'xuanfeng',
  name: '旋风',
  generalId: WU031_GENERAL_ID,
  type: 'passive',
  description: 'When you lose equipment or discard in discard phase, a target discards 1 card or takes 1 damage.',
  triggers: ['discardCards'],
  canActivate(ctx) {
    if (ctx.event.type !== 'discardCards') return false;
    return ctx.event.player === ctx.player.id && ctx.event.cards.length > 0;
  },
  activate(ctx) {
    if (ctx.event.type !== 'discardCards') return;
    // Simplified: deal 1 damage to a random other alive player
    const targets = ctx.game.players.filter(p => p.alive && p.id !== ctx.player.id);
    if (targets.length > 0) {
      const target = targets[0]!;
      ctx.dealDamage(ctx.player, target, 1);
    }
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets(_ctx, candidates) { return candidates.slice(0, 1); },
  },
};
