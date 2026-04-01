/**
 * WU019 徐盛 — 破军 (Pojun / Vanquish)
 * Passive skill. When your 杀 deals damage to a target, face-down that many
 * cards from their area. At the end of their next turn, return them.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU019_GENERAL_ID = 'WU019' as GeneralId;

export const pojun: SkillPlugin = {
  id: 'pojun',
  name: '破军',
  generalId: WU019_GENERAL_ID,
  type: 'passive',
  description: 'When your 杀 damages a target, face-down that many of their cards until their next turn end.',
  triggers: ['damage'],
  canActivate(ctx) {
    if (ctx.event.type !== 'damage') return false;
    return ctx.event.source === ctx.player.id;
  },
  activate(ctx) {
    if (ctx.event.type !== 'damage') return;
    const target = ctx.game.players.find(p => p.id === ctx.event.target);
    if (!target) return;
    // Mark cards as temporarily removed
    target.marks['pojun_lockdown'] = ctx.event.amount;
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};
