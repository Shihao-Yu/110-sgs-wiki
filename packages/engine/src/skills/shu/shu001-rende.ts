/**
 * SHU001 刘备 — 仁德 (Benevolence)
 *
 * Active skill. During the play phase, give any number of hand cards
 * to another player. If you give 2 or more cards in a single activation,
 * recover 1 HP.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const rende: SkillPlugin = {
  id: 'rende',
  name: '仁德',
  generalId: 'SHU001' as GeneralId,
  type: 'active',
  description:
    'During the play phase, give any number of hand cards to another player. If you give ≥2 cards, recover 1 HP.',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'play') return false;
    if (ctx.player.handCards.length === 0) return false;

    // Must have at least one other alive player to give cards to
    return ctx.game.players.some(
      (p) => p.alive && p.id !== ctx.player.id,
    );
  },

  activate(ctx) {
    // Determine the target — pick first alive other player as default
    const target = ctx.game.players.find(
      (p) => p.alive && p.id !== ctx.player.id,
    );
    if (!target) return;

    const cardsToGive = [...ctx.player.handCards];
    const giveCount = cardsToGive.length;
    if (giveCount === 0) return;

    // Transfer cards: remove from giver, add to receiver
    target.handCards.push(...cardsToGive);
    ctx.player.handCards = [];

    // If 2 or more cards were given, recover 1 HP
    if (giveCount >= 2 && ctx.player.hp < ctx.player.maxHp) {
      ctx.player.hp = Math.min(ctx.player.hp + 1, ctx.player.maxHp);
    }
  },
};
