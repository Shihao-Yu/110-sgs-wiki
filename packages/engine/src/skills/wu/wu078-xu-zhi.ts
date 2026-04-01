/**
 * WU078 徐质 — 骁袭 (Xiaoxi / Swift Raid)
 * Passive skill. Whenever you play a Slash as the first card in your
 * play phase, draw 1 card.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU078_GENERAL_ID = 'WU078' as GeneralId;

export const xiaoxi: SkillPlugin = {
  id: 'xiaoxi',
  name: '骁袭',
  generalId: WU078_GENERAL_ID,
  type: 'passive',
  description: 'When you play a Slash as the first card in your turn, draw 1 card.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    const card = ctx.event.card;
    return (
      ctx.event.player === ctx.player.id &&
      (card.name === 'Slash' || card.name === '杀') &&
      (ctx.player.marks['xiaoxi_played'] ?? 0) === 0
    );
  },
  activate(ctx) {
    ctx.player.marks['xiaoxi_played'] = 1;
    ctx.drawCards(ctx.player, 1);
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};
