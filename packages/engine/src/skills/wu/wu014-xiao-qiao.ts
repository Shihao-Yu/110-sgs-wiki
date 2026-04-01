/**
 * WU014 小乔 — 天香 (Tianxiang / Heavenly Fragrance)
 * Passive skill. When you take damage, you may discard a heart-suited hand card
 * to redirect the damage to another player. That player then draws X cards
 * (X = their lost HP after taking the redirected damage).
 *
 * 红颜 (Hongyan / Beauty)
 * Lock skill. Your spade-suited cards are treated as heart suit.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU014_GENERAL_ID = 'WU014' as GeneralId;

export const tianxiang: SkillPlugin = {
  id: 'tianxiang',
  name: '天香',
  generalId: WU014_GENERAL_ID,
  type: 'passive',
  description:
    'When damaged, discard a heart card to redirect damage to another player, who then draws cards equal to HP lost.',
  triggers: ['damage'],

  canActivate(ctx) {
    if (ctx.event.type !== 'damage') return false;
    if (ctx.event.target !== ctx.player.id) return false;
    return ctx.player.handCards.some(c => c.suit === 'heart');
  },

  activate(ctx) {
    if (ctx.event.type !== 'damage') return;

    const heartIdx = ctx.player.handCards.findIndex(c => c.suit === 'heart');
    if (heartIdx === -1) return;

    const heartCard = ctx.player.handCards[heartIdx]!;
    ctx.discardCards(ctx.player, [heartCard]);

    const target = ctx.game.players.find(
      p => p.id !== ctx.player.id && p.alive,
    );
    if (!target) return;

    ctx.dealDamage(ctx.player, target, ctx.event.amount);
    const hpLost = target.maxHp - target.hp;
    if (hpLost > 0) {
      ctx.drawCards(target, hpLost);
    }
  },

  ai: {
    shouldActivate(ctx) {
      return ctx.player.handCards.some(c => c.suit === 'heart');
    },
    selectTargets(_ctx, candidates) {
      return candidates.slice(0, 1);
    },
  },
};

export const hongyan: SkillPlugin = {
  id: 'hongyan',
  name: '红颜',
  generalId: WU014_GENERAL_ID,
  type: 'lock',
  description: 'Your spade-suited cards are treated as heart suit.',
  triggers: ['playCard'],

  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return ctx.event.card.suit === 'spade' && ctx.event.player === ctx.player.id;
  },

  activate(ctx) {
    if (ctx.event.type !== 'playCard') return;
    // Transform the suit to heart
    (ctx.event.card as { suit: string }).suit = 'heart';
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
