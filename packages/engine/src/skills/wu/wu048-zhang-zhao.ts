/**
 * WU048 张昭 — 直谏 (Zhijian Alt / Forthright Advice)
 * Active skill. During your play phase, you may give an equipment card from
 * your hand to another player and draw 1 card.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU048_GENERAL_ID = 'WU048' as GeneralId;

export const zhijianZhangzhao: SkillPlugin = {
  id: 'zhijian_zhangzhao',
  name: '直谏',
  generalId: WU048_GENERAL_ID,
  type: 'active',
  description: 'Give an equipment card to another player and draw 1 card.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return ctx.player.handCards.some(c => c.type === 'equipment');
  },
  activate(ctx) {
    if (ctx.event.type !== 'playCard') return;
    const equipIdx = ctx.player.handCards.findIndex(c => c.type === 'equipment');
    if (equipIdx >= 0) {
      const targets = ctx.event.targets ?? [];
      const target = ctx.game.players.find(p => targets.includes(p.id));
      if (target) {
        const [card] = ctx.player.handCards.splice(equipIdx, 1);
        target.handCards.push(card!);
      }
      ctx.drawCards(ctx.player, 1);
    }
  },
  ai: {
    shouldActivate(ctx) {
      return ctx.player.handCards.some(c => c.type === 'equipment');
    },
    selectTargets(_ctx, candidates) { return candidates.slice(0, 1); },
  },
};
