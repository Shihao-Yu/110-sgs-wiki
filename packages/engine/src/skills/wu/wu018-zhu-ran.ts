/**
 * WU018 朱然 — 胆守 (Danshou / Bold Guard)
 * Passive skill. After you deal damage, draw 1 card. After you take damage,
 * perform a judgment: if heart, recover 1 HP.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU018_GENERAL_ID = 'WU018' as GeneralId;

export const danshou: SkillPlugin = {
  id: 'danshou',
  name: '胆守',
  generalId: WU018_GENERAL_ID,
  type: 'passive',
  description: 'After dealing damage, draw 1 card. After taking damage, judge: if heart, recover 1 HP.',
  triggers: ['damage'],
  canActivate(ctx) {
    if (ctx.event.type !== 'damage') return false;
    return ctx.event.source === ctx.player.id || ctx.event.target === ctx.player.id;
  },
  activate(ctx) {
    if (ctx.event.type !== 'damage') return;
    if (ctx.event.source === ctx.player.id) {
      ctx.drawCards(ctx.player, 1);
    }
    if (ctx.event.target === ctx.player.id) {
      // Simplified judgment: check top card of draw pile
      const judgeCard = ctx.game.drawPile[0];
      if (judgeCard && judgeCard.suit === 'heart' && ctx.player.hp < ctx.player.maxHp) {
        ctx.player.hp += 1;
      }
    }
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};
