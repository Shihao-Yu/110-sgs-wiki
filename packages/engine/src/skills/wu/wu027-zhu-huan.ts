/**
 * WU027 朱桓 — 奋威 (Fenwei / Mighty Display)
 * Limited skill (once per game). When a trick card with multiple targets
 * resolves, you may make it have no effect on any number of those targets.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU027_GENERAL_ID = 'WU027' as GeneralId;

export const fenwei: SkillPlugin = {
  id: 'fenwei',
  name: '奋威',
  generalId: WU027_GENERAL_ID,
  type: 'limited',
  description: 'Once per game, when a multi-target trick resolves, nullify it for chosen targets.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return (
      ctx.event.card.type === 'trick' &&
      (ctx.event.targets ?? []).length > 1 &&
      (ctx.player.marks['fenwei_used'] ?? 0) === 0
    );
  },
  activate(ctx) {
    ctx.player.marks['fenwei_used'] = 1;
    if (ctx.event.type !== 'playCard') return;
    // Remove all targets — nullify effect
    if (ctx.event.targets) {
      ctx.event.targets.length = 0;
    }
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.hp <= 2; },
    selectTargets() { return []; },
  },
};
