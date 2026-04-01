/**
 * QUN034 兀突骨 (Wu Tu Gu) — 南蛮之巨
 *
 * 铁甲 (Iron Armor / Tiejia): Lock skill. Damage from 杀 and
 * normal strategy cards is reduced by 1. Fire damage ignores this.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN034 = 'QUN034' as GeneralId;

/**
 * 铁甲 — Reduce non-fire damage by 1 (simplified).
 */
export const tiejia: SkillPlugin = {
  id: 'qun_tiejia',
  name: '铁甲',
  generalId: QUN034,
  type: 'passive',
  description: '锁定技，当你受到非火焰伤害时，令伤害-1。',
  triggers: ['damage'],

  canActivate(ctx) {
    if (ctx.event.type !== 'damage') return false;
    // Only when this player is the target
    if (ctx.event.target !== ctx.player.id) return false;
    // Does not apply to fire damage
    if (ctx.event.element === 'fire') return false;
    return true;
  },

  activate(ctx) {
    if (ctx.event.type !== 'damage') return;
    // Reduce damage by 1 (minimum 0)
    ctx.event.amount = Math.max((ctx.event.amount ?? 1) - 1, 0);
  },
};

export const qun034Skills: SkillPlugin[] = [tiejia];
