/**
 * WU008 孙尚香 — 结姻 (Jieyin / Marriage)
 * Active skill. During your play phase, you may discard 2 hand cards and
 * select a wounded male character. Both you and that character recover 1 HP.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU008_GENERAL_ID = 'WU008' as GeneralId;

export const jieyin: SkillPlugin = {
  id: 'jieyin',
  name: '结姻',
  generalId: WU008_GENERAL_ID,
  type: 'active',
  description:
    'Discard 2 hand cards targeting a wounded male character. Both recover 1 HP.',
  triggers: ['useSkill'],

  canActivate(ctx) {
    if (ctx.event.type !== 'useSkill') return false;
    // Need at least 2 hand cards
    return ctx.player.handCards.length >= 2;
  },

  activate(ctx) {
    if (ctx.event.type !== 'useSkill') return;
    const targets = ctx.event.targets ?? [];
    if (targets.length === 0) return;

    // Discard 2 hand cards
    const toDiscard = ctx.player.handCards.slice(0, 2);
    ctx.discardCards(ctx.player, toDiscard);

    const targetId = targets[0];
    const targetPlayer = ctx.game.players.find(p => p.id === targetId);
    if (!targetPlayer) return;

    // Both recover 1 HP (capped at max)
    if (ctx.player.hp < ctx.player.maxHp) {
      ctx.player.hp += 1;
    }
    if (targetPlayer.hp < targetPlayer.maxHp) {
      targetPlayer.hp += 1;
    }
  },

  ai: {
    shouldActivate(ctx) {
      // Activate when we have spare cards and are wounded
      return ctx.player.handCards.length >= 3 && ctx.player.hp < ctx.player.maxHp;
    },
    selectTargets(_ctx, candidates) {
      return candidates.slice(0, 1);
    },
  },
};
