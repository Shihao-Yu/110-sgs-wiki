/**
 * WU006 大乔 — 国色 (Guose / Beauty)
 * Active skill. You may use a diamond-suited card as 乐不思蜀
 * (Indulgence — delayed trick placed in target's judgment area).
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU006_GENERAL_ID = 'WU006' as GeneralId;

export const guose: SkillPlugin = {
  id: 'guose',
  name: '国色',
  generalId: WU006_GENERAL_ID,
  type: 'active',
  description: 'You may use a diamond-suited card as 乐不思蜀 (Indulgence).',
  triggers: ['playCard'],

  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return ctx.event.card.suit === 'diamond';
  },

  activate(ctx) {
    if (ctx.event.type !== 'playCard') return;
    const targets = ctx.event.targets ?? [];
    if (targets.length === 0) return;

    const targetId = targets[0];
    const targetPlayer = ctx.game.players.find(p => p.id === targetId);
    if (!targetPlayer) return;

    // Remove the card from player's hand and place in target's judgment area
    const card = ctx.event.card;
    ctx.player.handCards = ctx.player.handCards.filter(c => c.id !== card.id);
    targetPlayer.judgmentArea.push({
      ...card,
      name: '乐不思蜀',
      type: 'trick',
      subtype: 'delayedTrick',
    });
  },

  ai: {
    shouldActivate(ctx) {
      if (ctx.event.type !== 'playCard') return false;
      return ctx.event.card.suit === 'diamond';
    },
    selectTargets(_ctx, candidates) {
      return candidates.slice(0, 1);
    },
  },
};
