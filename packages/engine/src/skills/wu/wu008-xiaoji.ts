/**
 * WU008 孙尚香 — 枭姬 (Xiaoji / Warrior Lady)
 * Lock skill. Whenever you lose or replace an equipment card, draw 2 cards.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU008_GENERAL_ID = 'WU008' as GeneralId;

export const xiaoji: SkillPlugin = {
  id: 'xiaoji',
  name: '枭姬',
  generalId: WU008_GENERAL_ID,
  type: 'lock',
  description: 'When you lose or replace an equipment card, draw 2 cards.',
  triggers: ['discardCards'],

  canActivate(ctx) {
    if (ctx.event.type !== 'discardCards') return false;
    if (ctx.event.player !== ctx.player.id) return false;

    // Check if any discarded card was an equipment card
    return ctx.event.cards.some(card => card.type === 'equipment');
  },

  activate(ctx) {
    if (ctx.event.type !== 'discardCards') return;
    // Draw 2 cards for each equipment lost
    const equipCount = ctx.event.cards.filter(card => card.type === 'equipment').length;
    ctx.drawCards(ctx.player, equipCount * 2);
  },

  ai: {
    shouldActivate() {
      return true; // Lock skill
    },
    selectTargets() {
      return [];
    },
  },
};
