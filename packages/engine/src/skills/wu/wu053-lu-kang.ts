/**
 * WU053 陆抗 — 镇卫 (Zhenwei / Garrison Defense)
 * Passive skill. When another player within your attack range becomes the
 * target of a 杀, you may discard 1 card to transfer the target to yourself.
 * If you do, draw 1 card.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU053_GENERAL_ID = 'WU053' as GeneralId;

export const zhenwei: SkillPlugin = {
  id: 'zhenwei',
  name: '镇卫',
  generalId: WU053_GENERAL_ID,
  type: 'passive',
  description: 'Discard 1 card to redirect a Slash targeting an ally to yourself; draw 1 card.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    const card = ctx.event.card;
    const targets = ctx.event.targets ?? [];
    return (
      (card.name === 'Slash' || card.name === '杀') &&
      targets.length > 0 &&
      !targets.includes(ctx.player.id) &&
      ctx.event.player !== ctx.player.id &&
      ctx.player.handCards.length > 0
    );
  },
  activate(ctx) {
    if (ctx.event.type !== 'playCard') return;
    // Discard 1 card
    if (ctx.player.handCards.length > 0) {
      ctx.discardCards(ctx.player, [ctx.player.handCards[0]!]);
    }
    // Redirect target to self
    if (ctx.event.targets && ctx.event.targets.length > 0) {
      ctx.event.targets[0] = ctx.player.id;
    }
    // Draw 1 card as compensation
    ctx.drawCards(ctx.player, 1);
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.hp >= 3 && ctx.player.handCards.length >= 2; },
    selectTargets() { return []; },
  },
};
