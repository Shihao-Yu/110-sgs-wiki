/**
 * WU055 朱然 (alt) — 胆守 (Danshou / Courageous Guard, alt)
 * Passive skill (alternate version). After you deal damage to a player,
 * you may draw cards equal to the damage dealt.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU055_GENERAL_ID = 'WU055' as GeneralId;

export const danshouAlt: SkillPlugin = {
  id: 'danshouAlt',
  name: '胆守',
  generalId: WU055_GENERAL_ID,
  type: 'passive',
  description: 'After dealing damage, draw cards equal to the damage dealt.',
  triggers: ['damage'],
  canActivate(ctx) {
    if (ctx.event.type !== 'damage') return false;
    return ctx.event.source === ctx.player.id;
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
