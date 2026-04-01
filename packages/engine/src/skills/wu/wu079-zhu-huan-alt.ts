/**
 * WU079 朱桓 (alt) — 奋威 (Fenwei / Awe-inspiring, alt)
 * Limited skill. When a trick card targets 2+ players, you may make it
 * ineffective for all targets.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU079_GENERAL_ID = 'WU079' as GeneralId;

export const fenweiAlt: SkillPlugin = {
  id: 'fenweiAlt',
  name: '奋威',
  generalId: WU079_GENERAL_ID,
  type: 'limited',
  description: 'Negate a trick card targeting 2+ players.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    const targets = ctx.event.targets ?? [];
    return (
      ctx.event.card.type === 'trick' &&
      targets.length >= 2 &&
      (ctx.player.marks['fenweiAlt_used'] ?? 0) === 0
    );
  },
  activate(ctx) {
    ctx.player.marks['fenweiAlt_used'] = 1;
    // Negate by clearing all targets
    if (ctx.event.type === 'playCard' && ctx.event.targets) {
      ctx.event.targets.length = 0;
    }
  },
  ai: {
    shouldActivate(ctx) {
      const targets = ctx.event.type === 'playCard' ? (ctx.event.targets ?? []) : [];
      return targets.includes(ctx.player.id);
    },
    selectTargets() { return []; },
  },
};
