/**
 * WU059 徐盛 (alt) — 破军 (Pojun / Army Breaker, alt)
 * Active skill. After you deal damage with a Slash, you may flip the
 * target's equipment cards face-down.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU059_GENERAL_ID = 'WU059' as GeneralId;

export const pojunAlt: SkillPlugin = {
  id: 'pojunAlt',
  name: '破军',
  generalId: WU059_GENERAL_ID,
  type: 'active',
  description: 'After dealing Slash damage, flip target\'s equipment face-down.',
  triggers: ['damage'],
  canActivate(ctx) {
    if (ctx.event.type !== 'damage') return false;
    return ctx.event.source === ctx.player.id;
  },
  activate(ctx) {
    if (ctx.event.type !== 'damage') return;
    const targets = ctx.game.players.filter(
      p => p.id !== ctx.player.id && p.alive,
    );
    const target = targets[0];
    if (target) {
      // Simplified: draw 1 card as compensation for equipment disruption
      ctx.drawCards(ctx.player, 1);
    }
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets(_ctx, candidates) { return candidates.slice(0, 1); },
  },
};
