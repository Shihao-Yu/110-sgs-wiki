/**
 * QUN043 李儒 (Li Ru) — 鸩毒之士
 *
 * 灭计 (Annihilate / Mieji): During your play phase, you may discard
 * a black card to force another player to choose: discard 2 cards or
 * lose 1 HP.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN043 = 'QUN043' as GeneralId;

/**
 * 灭计 — Discard a black card to force a target to discard 2 or lose 1 HP.
 * Simplified: AI always chooses to lose 1 HP if they have fewer than 2 cards.
 */
export const mieji: SkillPlugin = {
  id: 'qun_mieji',
  name: '灭计',
  generalId: QUN043,
  type: 'active',
  description:
    '出牌阶段，你可以弃置一张黑色牌并选择一名其他角色，该角色选择：弃两张牌或失去1点体力。',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'play') return false;
    // Need a black card to discard
    return ctx.player.handCards.some(
      c => c.suit === 'spade' || c.suit === 'club',
    );
  },

  activate(ctx) {
    const blackIdx = ctx.player.handCards.findIndex(
      c => c.suit === 'spade' || c.suit === 'club',
    );
    if (blackIdx === -1) return;

    const [blackCard] = ctx.player.handCards.splice(blackIdx, 1);
    ctx.game.discardPile.push(blackCard);

    // Pick an alive opponent
    const target = ctx.game.players.find(
      p => p.alive && p.id !== ctx.player.id,
    );
    if (!target) return;

    // Simplified decision: lose HP if fewer than 2 cards, else discard 2
    if (target.handCards.length >= 2) {
      const discarded = target.handCards.splice(0, 2);
      ctx.game.discardPile.push(...discarded);
    } else {
      target.hp = Math.max(target.hp - 1, 0);
    }
  },
};

export const qun043Skills: SkillPlugin[] = [mieji];
