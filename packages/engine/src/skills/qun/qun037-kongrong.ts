/**
 * QUN037 孔融 (Kong Rong) — 名士
 *
 * 礼让 (Courtesy / Lirang): When you must discard hand cards in the
 * discard phase, you may give them to other players instead of discarding.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN037 = 'QUN037' as GeneralId;

/**
 * 礼让 — Give excess hand cards to another player during discard phase.
 * Simplified: transfers one excess card to the player with fewest cards.
 */
export const lirang: SkillPlugin = {
  id: 'qun_lirang',
  name: '礼让',
  generalId: QUN037,
  type: 'active',
  description: '摸牌阶段，你可以少摸一张牌；弃牌阶段，你可以将弃置的牌交给其他角色。',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'discard') return false;
    // Must have cards to give
    return ctx.player.handCards.length > ctx.player.hp;
  },

  activate(ctx) {
    const excess = ctx.player.handCards.length - ctx.player.hp;
    if (excess <= 0) return;

    // Find the alive player (other than self) with the fewest cards
    const recipient = ctx.game.players
      .filter(p => p.alive && p.id !== ctx.player.id)
      .sort((a, b) => a.handCards.length - b.handCards.length)[0];

    if (!recipient) return;

    // Transfer up to `excess` cards
    const transferred = ctx.player.handCards.splice(0, excess);
    recipient.handCards.push(...transferred);
  },
};

export const qun037Skills: SkillPlugin[] = [lirang];
