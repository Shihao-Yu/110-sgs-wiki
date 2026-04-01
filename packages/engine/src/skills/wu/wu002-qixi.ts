/**
 * WU002 甘宁 — 奇袭 (Qixi / Surprise Attack)
 * Active skill. You may use any black-suited card (spade or club) as 过河拆桥
 * (Dismantlement — targets one other player's card and discards it).
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU002_GENERAL_ID = 'WU002' as GeneralId;

export const qixi: SkillPlugin = {
  id: 'qixi',
  name: '奇袭',
  generalId: WU002_GENERAL_ID,
  type: 'active',
  description:
    'You may use any black-suited card (spade/club) as 过河拆桥 (Dismantlement).',
  triggers: ['playCard'],

  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    // Check if the played card is black-suited
    const card = ctx.event.card;
    return card.suit === 'spade' || card.suit === 'club';
  },

  activate(ctx) {
    if (ctx.event.type !== 'playCard') return;
    const targets = ctx.event.targets ?? [];
    if (targets.length === 0) return;

    const targetId = targets[0];
    const targetPlayer = ctx.game.players.find(p => p.id === targetId);
    if (!targetPlayer) return;

    // Discard a random card from the target (simplified: first hand card)
    if (targetPlayer.handCards.length > 0) {
      const stolen = targetPlayer.handCards[0]!;
      ctx.discardCards(targetPlayer, [stolen]);
    }
  },

  ai: {
    shouldActivate(ctx) {
      if (ctx.event.type !== 'playCard') return false;
      const card = ctx.event.card;
      return card.suit === 'spade' || card.suit === 'club';
    },
    selectTargets(ctx, candidates) {
      return candidates.slice(0, 1);
    },
  },
};
