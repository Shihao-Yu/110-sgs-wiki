/**
 * WU060 诸葛亮 (Wu ver.) — 火攻 (Huogong / Fire Attack)
 * Active skill. Once per turn, show 1 hand card. Target player must
 * discard a card of the same suit or take 1 fire damage.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU060_GENERAL_ID = 'WU060' as GeneralId;

export const huogong: SkillPlugin = {
  id: 'huogong',
  name: '火攻',
  generalId: WU060_GENERAL_ID,
  type: 'active',
  description: 'Show 1 card; target discards same suit or takes 1 fire damage.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return (
      ctx.player.handCards.length > 0 &&
      (ctx.player.marks['huogong_used'] ?? 0) === 0
    );
  },
  activate(ctx) {
    ctx.player.marks['huogong_used'] = 1;
    const targets = ctx.event.type === 'playCard' ? (ctx.event.targets ?? []) : [];
    const target = ctx.game.players.find(p => targets.includes(p.id));
    if (target) {
      // Simplified: deal 1 fire damage
      ctx.dealDamage(ctx.player, target, 1);
    }
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.handCards.length >= 2; },
    selectTargets(_ctx, candidates) { return candidates.slice(0, 1); },
  },
};
