/**
 * WU022 潘璋&马忠 — 暗箭 (Anjian / Hidden Arrow)
 * Lock skill. When you deal damage with 杀 to a player who cannot see you
 * (you are not in their attack range), +1 damage.
 *
 * 双刃 (Shuangren / Double Edge)
 * Active skill. At play phase start, point fight with a player. Win: use a
 * 杀 for free. Lose: they draw 1.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU022_GENERAL_ID = 'WU022' as GeneralId;

export const anjian: SkillPlugin = {
  id: 'anjian',
  name: '暗箭',
  generalId: WU022_GENERAL_ID,
  type: 'lock',
  description: 'When your 杀 hits a player who cannot reach you, +1 damage.',
  triggers: ['damage'],
  canActivate(ctx) {
    if (ctx.event.type !== 'damage') return false;
    return ctx.event.source === ctx.player.id;
  },
  activate(ctx) {
    if (ctx.event.type !== 'damage') return;
    const target = ctx.game.players.find(p => p.id === ctx.event.target);
    if (!target) return;
    // Simplified: increase damage mark
    target.marks['anjian_extra'] = (target.marks['anjian_extra'] ?? 0) + 1;
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};

export const shuangren: SkillPlugin = {
  id: 'shuangren',
  name: '双刃',
  generalId: WU022_GENERAL_ID,
  type: 'active',
  description: 'Point fight at play phase start. Win: free 杀. Lose: they draw 1.',
  triggers: ['phaseChange'],
  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    return ctx.event.phase === 'play' && ctx.player.handCards.length > 0;
  },
  activate(ctx) {
    // Simplified: draw 1 card as reward for winning the point fight
    ctx.drawCards(ctx.player, 1);
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.handCards.length >= 2; },
    selectTargets(_ctx, candidates) { return candidates.slice(0, 1); },
  },
};
