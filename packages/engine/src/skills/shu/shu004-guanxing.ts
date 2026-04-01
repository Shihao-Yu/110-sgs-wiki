/**
 * SHU004 诸葛亮 — 观星 (Stargaze)
 *
 * Active skill. At the start of the draw phase, look at the top X cards
 * of the draw pile (X = min(5, alive players)). Rearrange them: place
 * some on top (in chosen order) and the rest on the bottom.
 *
 * Default implementation: keeps the first half on top, sends the rest to bottom.
 * Real target selection would be handled by the UI / AI layer.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const guanxing: SkillPlugin = {
  id: 'guanxing',
  name: '观星',
  generalId: 'SHU004' as GeneralId,
  type: 'active',
  description:
    'At the start of the draw phase, look at the top X cards (X = min(5, alive players)). Put some on top, rest on bottom.',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    return ctx.event.phase === 'draw' && ctx.game.drawPile.length > 0;
  },

  activate(ctx) {
    const aliveCount = ctx.game.players.filter((p) => p.alive).length;
    const lookCount = Math.min(5, aliveCount, ctx.game.drawPile.length);

    // Remove the top X cards from the draw pile
    const looked = ctx.game.drawPile.splice(0, lookCount);

    // Default rearrangement: keep first half on top, send rest to bottom
    const topCount = Math.ceil(looked.length / 2);
    const onTop = looked.slice(0, topCount);
    const onBottom = looked.slice(topCount);

    // Place back: onTop goes to front, onBottom goes to end
    ctx.game.drawPile.unshift(...onTop);
    ctx.game.drawPile.push(...onBottom);
  },
};
