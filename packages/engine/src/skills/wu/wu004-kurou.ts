/**
 * WU004 黄盖 — 苦肉 (Kurou / Self-harm)
 * Active skill. During your play phase, you may lose 1 HP to draw 2 cards.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU004_GENERAL_ID = 'WU004' as GeneralId;

export const kurou: SkillPlugin = {
  id: 'kurou',
  name: '苦肉',
  generalId: WU004_GENERAL_ID,
  type: 'active',
  description: 'During your play phase, you may lose 1 HP to draw 2 cards.',
  triggers: ['loseHp'],

  canActivate(ctx) {
    // Must have HP to lose
    return ctx.player.hp > 0 && ctx.player.alive;
  },

  activate(ctx) {
    // Lose 1 HP
    ctx.player.hp -= 1;
    // Draw 2 cards
    ctx.drawCards(ctx.player, 2);
  },

  ai: {
    shouldActivate(ctx) {
      // AI activates if HP is above 2 (safe to lose 1)
      return ctx.player.hp > 2;
    },
    selectTargets() {
      return [];
    },
  },
};
