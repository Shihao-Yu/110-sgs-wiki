/**
 * SHU010 庞统 (Pang Tong)
 *
 * 连环 (Lianhuan / Chain): You may use any club-suited card as 铁索连环.
 *
 * 涅槃 (Niepan / Nirvana): Limited skill. When you are in a dying state,
 * discard all your cards and flip your general card, then recover to 3 HP,
 * draw 3 cards.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const SHU010 = 'SHU010' as GeneralId;

/**
 * 连环 — Use any club card as 铁索连环 (Iron Shackle).
 */
export const lianhuan: SkillPlugin = {
  id: 'lianhuan',
  name: '连环',
  generalId: SHU010,
  type: 'passive',
  description:
    'You may use any club-suited card as 铁索连环 (Iron Shackle).',
  triggers: ['playCard'],

  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    if (ctx.event.player !== ctx.player.id) return false;
    return ctx.player.handCards.some((card) => card.suit === 'club');
  },

  activate(ctx) {
    const clubCard = ctx.player.handCards.find((card) => card.suit === 'club');
    if (!clubCard) return;

    ctx.game.activeEffects.push({
      id: `lianhuan_${ctx.player.id}_${clubCard.id}`,
      name: 'lianhuan',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: [ctx.player.id],
      duration: 'phase',
      properties: {
        convertedCardId: clubCard.id,
        treatedAs: '铁索连环',
      },
    });
  },
};

/**
 * 涅槃 — Limited skill. When dying, discard all cards, flip general,
 * recover to 3 HP, draw 3 cards.
 */
export const niepan: SkillPlugin = {
  id: 'niepan',
  name: '涅槃',
  generalId: SHU010,
  type: 'limited',
  description:
    'Limited. When dying, discard all cards and flip your general card, then recover to 3 HP and draw 3 cards.',
  triggers: ['loseHp'],

  canActivate(ctx) {
    if (ctx.event.type !== 'loseHp') return false;
    if (ctx.event.player !== ctx.player.id) return false;
    // Only activates when player is in dying state (hp <= 0)
    if (ctx.player.hp > 0) return false;
    // Limited: check if already used this game
    return (ctx.player.marks['niepan_used'] ?? 0) === 0;
  },

  activate(ctx) {
    // Mark as used (limited skill)
    ctx.player.marks['niepan_used'] = 1;

    // Discard all hand cards
    const allCards = [...ctx.player.handCards];
    if (allCards.length > 0) {
      ctx.discardCards(ctx.player, allCards);
    }

    // Flip the general (toggle revealed state)
    if (ctx.player.mainGeneral) {
      ctx.player.mainGeneral.revealed = !ctx.player.mainGeneral.revealed;
    }

    // Recover to 3 HP
    ctx.player.hp = Math.min(3, ctx.player.maxHp);

    // Draw 3 cards
    ctx.drawCards(ctx.player, 3);
  },
};

export const shu010Skills: SkillPlugin[] = [lianhuan, niepan];
