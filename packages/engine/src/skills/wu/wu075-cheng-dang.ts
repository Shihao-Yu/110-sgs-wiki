/**
 * WU075 程党 — 忠辅 (Zhongfu / Loyal Support)
 * Passive skill. At the start of another player's turn, if their hand
 * is empty, you may let them draw 2 cards.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU075_GENERAL_ID = 'WU075' as GeneralId;

export const zhongfu: SkillPlugin = {
  id: 'zhongfu',
  name: '忠辅',
  generalId: WU075_GENERAL_ID,
  type: 'passive',
  description: 'At another player\'s turn start, if their hand is empty, let them draw 2.',
  triggers: ['phaseChange'],
  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.player === ctx.player.id) return false;
    if (ctx.event.phase !== 'prepare') return false;
    const target = ctx.game.players.find(p => p.id === ctx.event.player);
    return !!target && target.handCards.length === 0;
  },
  activate(ctx) {
    const target = ctx.game.players.find(p => p.id === ctx.event.player);
    if (target) {
      ctx.drawCards(target, 2);
    }
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};
