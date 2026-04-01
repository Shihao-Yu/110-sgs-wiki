/**
 * WU005 周瑜 — 反间 (Fanjian / Sow Dissension)
 * Active skill. During your play phase, give 1 hand card to another player.
 * That player must guess the suit. If wrong, they take 1 damage.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU005_GENERAL_ID = 'WU005' as GeneralId;

export const fanjian: SkillPlugin = {
  id: 'fanjian',
  name: '反间',
  generalId: WU005_GENERAL_ID,
  type: 'active',
  description:
    'Give 1 hand card to another player. They guess the suit — if wrong, they take 1 damage.',
  triggers: ['useSkill'],

  canActivate(ctx) {
    if (ctx.event.type !== 'useSkill') return false;
    return ctx.player.handCards.length > 0;
  },

  activate(ctx) {
    if (ctx.event.type !== 'useSkill') return;
    const targets = ctx.event.targets ?? [];
    if (targets.length === 0) return;

    const targetId = targets[0];
    const targetPlayer = ctx.game.players.find(p => p.id === targetId);
    if (!targetPlayer) return;

    // Give the first hand card to target
    const card = ctx.player.handCards.shift();
    if (!card) return;

    targetPlayer.handCards.push(card);

    // Simplified: AI opponent "guesses" wrong, so they take 1 damage
    // In a full implementation, askForResponse would prompt for suit guess
    ctx.dealDamage(ctx.player, targetPlayer, 1);
  },

  ai: {
    shouldActivate(ctx) {
      return ctx.player.handCards.length >= 2;
    },
    selectTargets(_ctx, candidates) {
      return candidates.slice(0, 1);
    },
  },
};
