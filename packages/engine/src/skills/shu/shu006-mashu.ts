/**
 * SHU006 马超 — 马术 (Horsemanship)
 *
 * Lock skill. The distance from you to other players is reduced by 1.
 * Implemented as an active effect that the TargetSelector distance
 * calculation can incorporate.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const mashu: SkillPlugin = {
  id: 'mashu',
  name: '马术',
  generalId: 'SHU006' as GeneralId,
  type: 'lock',
  description: 'The distance from you to other players is reduced by 1.',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    // Refresh the effect at the start of each prepare phase
    return ctx.event.type === 'phaseChange' && ctx.event.phase === 'prepare';
  },

  activate(ctx) {
    // Remove stale effects
    ctx.game.activeEffects = ctx.game.activeEffects.filter(
      (e) => !(e.name === 'mashu' && e.sourcePlayerId === ctx.player.id),
    );

    ctx.game.activeEffects.push({
      id: `mashu_${ctx.player.id}`,
      name: 'mashu',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: [ctx.player.id],
      duration: 'permanent',
      properties: { distanceReduction: 1 },
    });
  },
};
