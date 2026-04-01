/**
 * WU066 吕岱 — 贞固 (Zhengu / Steadfast Loyalty)
 * Passive skill. At the end of your turn, you may select a player whose
 * hand count differs from yours and make them draw or discard until they
 * have the same number of cards as you.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU066_GENERAL_ID = 'WU066' as GeneralId;

export const zhengu: SkillPlugin = {
  id: 'zhengu',
  name: '贞固',
  generalId: WU066_GENERAL_ID,
  type: 'passive',
  description: 'At turn end, equalize a player\'s hand size with yours.',
  triggers: ['phaseChange'],
  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    return ctx.event.player === ctx.player.id && ctx.event.phase === 'end';
  },
  activate(ctx) {
    const targets = ctx.game.players.filter(
      p => p.id !== ctx.player.id && p.alive,
    );
    const target = targets[0];
    if (target) {
      const diff = ctx.player.handCards.length - target.handCards.length;
      if (diff > 0) {
        ctx.drawCards(target, diff);
      }
    }
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.handCards.length >= 2; },
    selectTargets(_ctx, candidates) { return candidates.slice(0, 1); },
  },
};
