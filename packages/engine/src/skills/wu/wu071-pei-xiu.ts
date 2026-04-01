/**
 * WU071 裴秀 — 明图 (Mingtu / Clear Map)
 * Active skill. Once per turn, you may show the top 3 cards of the draw
 * pile and distribute them among players.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU071_GENERAL_ID = 'WU071' as GeneralId;

export const mingtu: SkillPlugin = {
  id: 'mingtu',
  name: '明图',
  generalId: WU071_GENERAL_ID,
  type: 'active',
  description: 'Reveal top 3 draw-pile cards and distribute among players.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return (
      ctx.event.player === ctx.player.id &&
      (ctx.player.marks['mingtu_used'] ?? 0) === 0
    );
  },
  activate(ctx) {
    ctx.player.marks['mingtu_used'] = 1;
    // Simplified: self draws 2, an ally draws 1
    ctx.drawCards(ctx.player, 2);
    const ally = ctx.game.players.find(
      p => p.id !== ctx.player.id && p.alive,
    );
    if (ally) {
      ctx.drawCards(ally, 1);
    }
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets(_ctx, candidates) { return candidates.slice(0, 1); },
  },
};
