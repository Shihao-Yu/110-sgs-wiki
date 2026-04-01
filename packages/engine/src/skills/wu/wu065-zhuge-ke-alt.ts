/**
 * WU065 诸葛恪 (alt) — 傲才 (Aocai / Proud Talent, alt)
 * Passive skill. When you need to use or play a card outside your turn,
 * you may look at the top 2 cards of the draw pile and use one of them.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU065_GENERAL_ID = 'WU065' as GeneralId;

export const aocaiAlt: SkillPlugin = {
  id: 'aocaiAlt',
  name: '傲才',
  generalId: WU065_GENERAL_ID,
  type: 'passive',
  description: 'Outside your turn, look at top 2 draw-pile cards and use one.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return ctx.event.player !== ctx.player.id;
  },
  activate(ctx) {
    // Simplified: draw 1 card as the peek-and-use effect
    ctx.drawCards(ctx.player, 1);
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};
