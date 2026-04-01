/**
 * WU069 谢景 — 执礼 (Zhili / Observe Rites)
 * Passive skill. When you play a card targeting another player, if your
 * hand is empty after playing, draw 2 cards.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU069_GENERAL_ID = 'WU069' as GeneralId;

export const zhili: SkillPlugin = {
  id: 'zhili',
  name: '执礼',
  generalId: WU069_GENERAL_ID,
  type: 'passive',
  description: 'When you play a card and your hand becomes empty, draw 2 cards.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return (
      ctx.event.player === ctx.player.id &&
      ctx.player.handCards.length === 0
    );
  },
  activate(ctx) {
    ctx.drawCards(ctx.player, 2);
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};
