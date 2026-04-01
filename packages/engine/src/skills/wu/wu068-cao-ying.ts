/**
 * WU068 曹婴 — 灵策 (Lingce / Spirit Stratagem)
 * Passive skill. After you use a trick card, you may draw 1 card.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU068_GENERAL_ID = 'WU068' as GeneralId;

export const lingce: SkillPlugin = {
  id: 'lingce',
  name: '灵策',
  generalId: WU068_GENERAL_ID,
  type: 'passive',
  description: 'After using a trick card, draw 1 card.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return (
      ctx.event.player === ctx.player.id &&
      ctx.event.card.type === 'trick'
    );
  },
  activate(ctx) {
    ctx.drawCards(ctx.player, 1);
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};
