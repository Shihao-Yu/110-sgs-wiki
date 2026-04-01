/**
 * SHU004 诸葛亮 — 空城 (Empty Fort)
 *
 * Lock skill. When you have no hand cards, you cannot be the target
 * of 杀 (Slash) or 决斗 (Duel).
 *
 * Implemented by pushing a persistent effect that the target-validation
 * layer can check.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const kongcheng: SkillPlugin = {
  id: 'kongcheng',
  name: '空城',
  generalId: 'SHU004' as GeneralId,
  type: 'lock',
  description:
    'When you have no hand cards, you cannot be the target of 杀 or 决斗.',
  triggers: ['playCard', 'discardCards'],

  canActivate(ctx) {
    // Re-evaluate whenever cards are played or discarded
    return ctx.player.handCards.length === 0;
  },

  activate(ctx) {
    // Remove any existing kongcheng effect for this player
    ctx.game.activeEffects = ctx.game.activeEffects.filter(
      (e) => !(e.name === 'kongcheng' && e.sourcePlayerId === ctx.player.id),
    );

    // Add immunity effect
    ctx.game.activeEffects.push({
      id: `kongcheng_${ctx.player.id}`,
      name: 'kongcheng',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: [ctx.player.id],
      duration: 'permanent',
      properties: {
        immuneTo: '杀,决斗',
      },
    });
  },
};
