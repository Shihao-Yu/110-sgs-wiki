/**
 * SHU003 张飞 — 咆哮 (Roar)
 *
 * Lock skill. You have no limit on the number of 杀 (Slash) you can use per turn.
 * Implemented by pushing an active effect that signals unlimited slash usage.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const paoxiao: SkillPlugin = {
  id: 'paoxiao',
  name: '咆哮',
  generalId: 'SHU003' as GeneralId,
  type: 'lock',
  description: 'You have no limit on the number of 杀 you can use per turn.',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    // Activates at the start of the play phase
    return ctx.event.type === 'phaseChange' && ctx.event.phase === 'play';
  },

  activate(ctx) {
    ctx.game.activeEffects.push({
      id: `paoxiao_${ctx.player.id}_${ctx.game.turnCount}`,
      name: 'paoxiao',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: [ctx.player.id],
      duration: 'turn',
      properties: { unlimitedSlash: true },
    });
  },
};
