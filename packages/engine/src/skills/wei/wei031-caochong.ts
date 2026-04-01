/**
 * WEI031 曹冲 (Cao Chong) — 仁爱的神童
 *
 * 称象 (Chengxiang): When you take damage, you may reveal the top 4 cards
 * of the draw pile; you obtain cards whose point total does not exceed 13,
 * and discard the rest.
 *
 * 仁心 (Renxin): When another player is about to take damage, you may
 * flip face-down and prevent the damage.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

/**
 * 称象 — Reveal top 4 cards; keep those summing to 13 or less.
 */
export const chengxiang: SkillPlugin = {
  id: 'skill_chengxiang',
  name: '称象',
  generalId: 'general_wei_031' as GeneralId,
  type: 'passive',
  description:
    '当你受到伤害后，你可以亮出牌堆顶的四张牌，然后获得其中点数之和不大于13的牌，将其余的牌置入弃牌堆。',
  triggers: ['damage'],

  canActivate(ctx) {
    if (ctx.event.type !== 'damage') return false;
    if (ctx.event.target !== ctx.player.id) return false;
    return ctx.game.drawPile.length >= 4;
  },

  activate(ctx) {
    // Reveal top 4 cards
    const revealed = ctx.game.drawPile.splice(0, 4);
    // Greedy selection: pick cards summing to <= 13
    const sorted = [...revealed].sort((a, b) => a.number - b.number);
    let sum = 0;
    const kept: typeof revealed = [];
    const discarded: typeof revealed = [];
    for (const card of sorted) {
      if (sum + card.number <= 13) {
        sum += card.number;
        kept.push(card);
      } else {
        discarded.push(card);
      }
    }
    ctx.player.handCards.push(...kept);
    ctx.game.discardPile.push(...discarded);
  },
};

/**
 * 仁心 — Flip face-down to prevent damage to another player.
 * Requires flip-state infrastructure.
 */
export const renxin: SkillPlugin = {
  id: 'skill_renxin',
  name: '仁心',
  generalId: 'general_wei_031' as GeneralId,
  type: 'passive',
  description:
    '当一名其他角色受到伤害时，你可以翻面，防止此伤害。',
  triggers: ['damage'],

  // TODO: Requires flip-state and damage-prevention infrastructure
  canActivate: () => false,

  activate() {
    /* Awaiting flip-state infrastructure */
  },
};

export const wei031Skills: SkillPlugin[] = [chengxiang, renxin];
