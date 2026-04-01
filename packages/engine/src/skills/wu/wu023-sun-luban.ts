/**
 * WU023 孙鲁班 — 谗毁 (Chanhui / Slander)
 * Active skill. When a 杀 targeting another player resolves, you may discard
 * 1 hand card to force that player to choose: discard 1 equipment or suffer
 * +1 damage from the 杀.
 *
 * 骄矜 (Jiaojin / Arrogance)
 * Passive skill. When damaged by a male character, you may discard 1 hand card
 * to reduce the damage by 1.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU023_GENERAL_ID = 'WU023' as GeneralId;

export const chanhui: SkillPlugin = {
  id: 'chanhui',
  name: '谗毁',
  generalId: WU023_GENERAL_ID,
  type: 'active',
  description: 'When 杀 resolves on another player, discard 1 card to add penalty.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return (
      (ctx.event.card.name === 'Slash' || ctx.event.card.name === '杀') &&
      ctx.player.handCards.length > 0
    );
  },
  activate(ctx) {
    if (ctx.player.handCards.length > 0) {
      ctx.discardCards(ctx.player, [ctx.player.handCards[0]!]);
    }
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.handCards.length >= 3; },
    selectTargets() { return []; },
  },
};

export const jiaojin: SkillPlugin = {
  id: 'jiaojin',
  name: '骄矜',
  generalId: WU023_GENERAL_ID,
  type: 'passive',
  description: 'When damaged by a male character, discard 1 hand card to reduce damage by 1.',
  triggers: ['damage'],
  canActivate(ctx) {
    if (ctx.event.type !== 'damage') return false;
    return ctx.event.target === ctx.player.id && ctx.player.handCards.length > 0;
  },
  activate(ctx) {
    if (ctx.player.handCards.length > 0) {
      ctx.discardCards(ctx.player, [ctx.player.handCards[0]!]);
    }
    // Damage reduction tracked via mark
    ctx.player.marks['jiaojin_reduced'] = 1;
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.handCards.length > 0; },
    selectTargets() { return []; },
  },
};
