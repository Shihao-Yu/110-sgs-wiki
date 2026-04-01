/**
 * WU038 诸葛恪 — 傲才 (Aocai / Proud Talent)
 * Passive skill. When you need to use/play a card outside your turn, you
 * may reveal the top 2 cards of the draw pile and use/play one of them.
 *
 * 敏杰 (Minjie / Quick Wit)
 * Lock skill. You may use trick cards without distance limit.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU038_GENERAL_ID = 'WU038' as GeneralId;

export const aocai: SkillPlugin = {
  id: 'aocai',
  name: '傲才',
  generalId: WU038_GENERAL_ID,
  type: 'passive',
  description: 'Off-turn, reveal top 2 draw pile cards and may use one as a response.',
  triggers: ['response'],
  canActivate(ctx) {
    if (ctx.event.type !== 'response') return false;
    return ctx.event.player === ctx.player.id;
  },
  activate(ctx) {
    // Simplified: draw 1 card as compensation for the response mechanic
    ctx.drawCards(ctx.player, 1);
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};

export const minjie: SkillPlugin = {
  id: 'minjie',
  name: '敏杰',
  generalId: WU038_GENERAL_ID,
  type: 'lock',
  description: 'Your trick cards have no distance limit.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return ctx.event.card.type === 'trick';
  },
  activate(_ctx) {
    // Distance limit removal — handled at resolution layer
    // Placeholder: no-op in simplified engine
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};
