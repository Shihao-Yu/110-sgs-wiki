/**
 * SHU008 魏延 — 狂骨 (Crazy Bone)
 *
 * Lock skill. When you deal damage to a player within distance 1,
 * you recover 1 HP.
 *
 * Distance check uses the seat-based circular distance. Equipment
 * horses are factored in by the TargetSelector, but here we use a
 * simplified inline calculation consistent with the engine's model.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const kuanggu: SkillPlugin = {
  id: 'kuanggu',
  name: '狂骨',
  generalId: 'SHU008' as GeneralId,
  type: 'lock',
  description:
    'When you deal damage to a player within distance 1, recover 1 HP.',
  triggers: ['damage'],

  canActivate(ctx) {
    if (ctx.event.type !== 'damage') return false;
    // Must be the source of the damage
    if (ctx.event.source !== ctx.player.id) return false;
    // Must be below max HP to benefit
    if (ctx.player.hp >= ctx.player.maxHp) return false;

    // Check distance to target
    const target = ctx.game.players.find((p) => p.id === ctx.event.target);
    if (!target || !target.alive) return false;

    const distance = getSimpleDistance(ctx.game.players, ctx.player, target);
    return distance <= 1;
  },

  activate(ctx) {
    ctx.player.hp = Math.min(ctx.player.hp + 1, ctx.player.maxHp);
  },
};

/**
 * Simplified circular-table distance for skill checks.
 * Mirrors TargetSelector logic without requiring a class instance.
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
