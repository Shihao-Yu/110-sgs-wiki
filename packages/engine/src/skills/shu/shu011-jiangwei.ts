/**
 * SHU011 姜维 (Jiang Wei)
 *
 * 挑衅 (Tiaoxin / Provoke): During your play phase, you may target a player
 * in your attack range. That player must use 杀 targeting you, or you deal
 * 1 damage to them.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const SHU011 = 'SHU011' as GeneralId;

/**
 * Simplified distance helper (consistent with kuanggu pattern).
 */
function getSimpleDistance(
  players: { id: unknown; seat: number; alive: boolean }[],
  from: { id: unknown; seat: number },
  to: { id: unknown; seat: number },
): number {
  if (from.id === to.id) return 0;

  const alive = players.filter((p) => p.alive);
  alive.sort((a, b) => a.seat - b.seat);

  const fromIdx = alive.findIndex((p) => p.id === from.id);
  const toIdx = alive.findIndex((p) => p.id === to.id);
  if (fromIdx === -1 || toIdx === -1) return Infinity;

  const n = alive.length;
  const clockwise = (toIdx - fromIdx + n) % n;
  const counterClockwise = (fromIdx - toIdx + n) % n;
  return Math.min(clockwise, counterClockwise);
}

/**
 * 挑衅 — Force a player in attack range to slash you or take 1 damage.
 */
export const tiaoxin: SkillPlugin = {
  id: 'tiaoxin',
  name: '挑衅',
  generalId: SHU011,
  type: 'active',
  description:
    'During play phase, force a player in your attack range to use 杀 on you, or deal 1 damage to them.',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'play') return false;

    // Must have at least one alive player within attack range
    const weapon = ctx.player.equipment.weapon;
    const attackRange = weapon?.range ?? 1;

    return ctx.game.players.some((p) => {
      if (!p.alive || p.id === ctx.player.id) return false;
      const dist = getSimpleDistance(ctx.game.players, ctx.player, p);
      return dist <= attackRange;
    });
  },

  activate(ctx) {
    const weapon = ctx.player.equipment.weapon;
    const attackRange = weapon?.range ?? 1;

    // Find the first player in attack range
    const target = ctx.game.players.find((p) => {
      if (!p.alive || p.id === ctx.player.id) return false;
      const dist = getSimpleDistance(ctx.game.players, ctx.player, p);
      return dist <= attackRange;
    });
    if (!target) return;

    // Check if target has a 杀 in hand to respond with
    const hasSlash = target.handCards.some((card) => card.name === '杀');

    if (hasSlash) {
      // Target responds with 杀 — in a full implementation this would
      // go through the response window. Here we simulate by pushing an effect.
      ctx.game.activeEffects.push({
        id: `tiaoxin_response_${ctx.player.id}_${target.id}`,
        name: 'tiaoxin',
        sourcePlayerId: ctx.player.id,
        targetPlayerIds: [target.id],
        duration: 'phase',
        properties: {
          mustSlash: ctx.player.id as string,
        },
      });
    } else {
      // Target cannot respond — deal 1 damage
      ctx.dealDamage(ctx.player, target, 1);
    }
  },
};

export const shu011Skills: SkillPlugin[] = [tiaoxin];
