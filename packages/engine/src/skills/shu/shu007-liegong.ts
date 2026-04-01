/**
 * SHU007 黄忠 — 烈弓 (Fierce Bow)
 *
 * Passive skill. When you use 杀, if the target's hand card count is
 * greater than or equal to your current HP, OR less than or equal to
 * your attack range, the target cannot use 闪 to dodge.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const liegong: SkillPlugin = {
  id: 'liegong',
  name: '烈弓',
  generalId: 'SHU007' as GeneralId,
  type: 'passive',
  description:
    'When you use 杀, if target hand count >= your HP or <= your attack range, target cannot 闪.',
  triggers: ['playCard'],

  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    if (ctx.event.card?.name !== '杀') return false;
    return ctx.event.player === ctx.player.id;
  },

  activate(ctx) {
    if (ctx.event.type !== 'playCard' || !ctx.event.targets) return;

    const attackerHp = ctx.player.hp;
    const weapon = ctx.player.equipment.weapon;
    const attackRange = weapon?.range ?? 1;

    for (const targetId of ctx.event.targets) {
      const target = ctx.game.players.find((p) => p.id === targetId);
      if (!target) continue;

      const targetHandCount = target.handCards.length;

      // Cannot dodge if hand count >= attacker HP or hand count <= attack range
      if (targetHandCount >= attackerHp || targetHandCount <= attackRange) {
        ctx.game.activeEffects.push({
          id: `liegong_${ctx.player.id}_${targetId}`,
          name: 'liegong',
          sourcePlayerId: ctx.player.id,
          targetPlayerIds: [targetId],
          duration: 'phase',
          properties: { cannotDodge: true },
        });
      }
    }
  },
};
