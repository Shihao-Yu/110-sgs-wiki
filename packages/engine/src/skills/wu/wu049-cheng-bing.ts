/**
 * WU049 程秉 — 识达 (Shida / Scholarly Insight)
 * Passive skill. After your draw phase, you may show 1 hand card. If
 * another player has a card of the same type, they must give you 1 card.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU049_GENERAL_ID = 'WU049' as GeneralId;

export const shida: SkillPlugin = {
  id: 'shida',
  name: '识达',
  generalId: WU049_GENERAL_ID,
  type: 'passive',
  description: 'After draw phase, show 1 card; if another player has same type, they give you 1 card.',
  triggers: ['phaseChange'],
  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    return (
      ctx.event.player === ctx.player.id &&
      ctx.event.phase === 'play' &&
      ctx.player.handCards.length > 0
    );
  },
  activate(ctx) {
    // Simplified: draw 1 card representing the knowledge advantage
    ctx.drawCards(ctx.player, 1);
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.handCards.length > 0; },
    selectTargets() { return []; },
  },
};
