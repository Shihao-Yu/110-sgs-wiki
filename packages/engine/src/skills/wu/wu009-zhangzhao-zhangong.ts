/**
 * WU009 张昭&张纮 — 直谏 (Zhijian / Direct Remonstrance)
 * Active skill. Give an equipment card from your hand directly to another player.
 * Draw 1 card.
 *
 * 固政 (Guzheng / Stabilize)
 * Passive skill. When another player discards cards in their discard phase,
 * you may return one of those cards to them.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU009_GENERAL_ID = 'WU009' as GeneralId;

export const zhijian: SkillPlugin = {
  id: 'zhijian',
  name: '直谏',
  generalId: WU009_GENERAL_ID,
  type: 'active',
  description: 'Give an equipment card from hand to another player, then draw 1 card.',
  triggers: ['useSkill'],

  canActivate(ctx) {
    if (ctx.event.type !== 'useSkill') return false;
    return ctx.player.handCards.some(c => c.type === 'equipment');
  },

  activate(ctx) {
    if (ctx.event.type !== 'useSkill') return;
    const targets = ctx.event.targets ?? [];
    if (targets.length === 0) return;

    const equipCard = ctx.player.handCards.find(c => c.type === 'equipment');
    if (!equipCard) return;

    const targetPlayer = ctx.game.players.find(p => p.id === targets[0]);
    if (!targetPlayer) return;

    ctx.player.handCards = ctx.player.handCards.filter(c => c.id !== equipCard.id);
    targetPlayer.handCards.push(equipCard);
    ctx.drawCards(ctx.player, 1);
  },

  ai: {
    shouldActivate(ctx) {
      return ctx.player.handCards.some(c => c.type === 'equipment');
    },
    selectTargets(_ctx, candidates) {
      return candidates.slice(0, 1);
    },
  },
};

export const guzheng: SkillPlugin = {
  id: 'guzheng',
  name: '固政',
  generalId: WU009_GENERAL_ID,
  type: 'passive',
  description:
    "When another player discards during discard phase, you may return one card to them.",
  triggers: ['discardCards'],

  canActivate(ctx) {
    if (ctx.event.type !== 'discardCards') return false;
    return ctx.event.player !== ctx.player.id;
  },

  activate(ctx) {
    if (ctx.event.type !== 'discardCards') return;
    // Return the first discarded card to the player
    const targetPlayer = ctx.game.players.find(p => p.id === ctx.event.player);
    if (!targetPlayer || ctx.event.cards.length === 0) return;

    const returnCard = ctx.game.discardPile.pop();
    if (returnCard) {
      targetPlayer.handCards.push(returnCard);
    }
  },

  ai: {
    shouldActivate() {
      return true;
    },
    selectTargets() {
      return [];
    },
  },
};
