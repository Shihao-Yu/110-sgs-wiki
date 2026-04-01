/**
 * WU072 吴景 — 奋勇 (Fenyong / Brave Charge)
 * Passive skill. When you take damage, you may draw 1 card per damage
 * point received.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU072_GENERAL_ID = 'WU072' as GeneralId;

export const fenyong: SkillPlugin = {
  id: 'fenyong',
  name: '奋勇',
  generalId: WU072_GENERAL_ID,
  type: 'passive',
  description: 'When taking damage, draw 1 card per damage point.',
  triggers: ['damage'],
  canActivate(ctx) {
    if (ctx.event.type !== 'damage') return false;
    return ctx.event.target === ctx.player.id;
  },
  activate(ctx) {
    if (ctx.event.type !== 'damage') return;
    const amount = ctx.event.amount ?? 1;
    ctx.drawCards(ctx.player, amount);
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};
