/**
 * SHU019 诸葛亮·卧龙 (Zhuge Liang — Crouching Dragon)
 *
 * 火计 (Huoji / Fire Plan): You may use any red hand card as 火攻.
 *
 * 看破 (Kanpo / See Through): You may use any black hand card as 无懈可击.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const SHU019 = 'SHU019' as GeneralId;
const RED_SUITS = new Set(['heart', 'diamond']);
const BLACK_SUITS = new Set(['spade', 'club']);

export const huoji: SkillPlugin = {
  id: 'huoji',
  name: '火计',
  generalId: SHU019,
  type: 'passive',
  description: 'You may use any red hand card as 火攻 (Fire Attack).',
  triggers: ['playCard'],

  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    if (ctx.event.player !== ctx.player.id) return false;
    return ctx.player.handCards.some((card) => RED_SUITS.has(card.suit));
  },

  activate(ctx) {
    const redCard = ctx.player.handCards.find((card) => RED_SUITS.has(card.suit));
    if (!redCard) return;

    ctx.game.activeEffects.push({
      id: `huoji_${ctx.player.id}_${redCard.id}`,
      name: 'huoji',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: [ctx.player.id],
      duration: 'phase',
      properties: {
        convertedCardId: redCard.id,
        treatedAs: '火攻',
      },
    });
  },
};

export const kanpo: SkillPlugin = {
  id: 'kanpo',
  name: '看破',
  generalId: SHU019,
  type: 'passive',
  description: 'You may use any black hand card as 无懈可击 (Nullification).',
  triggers: ['playCard', 'response'],

  canActivate(ctx) {
    if (ctx.event.type !== 'playCard' && ctx.event.type !== 'response') return false;
    return ctx.player.handCards.some((card) => BLACK_SUITS.has(card.suit));
  },

  activate(ctx) {
    const blackCard = ctx.player.handCards.find((card) => BLACK_SUITS.has(card.suit));
    if (!blackCard) return;

    ctx.game.activeEffects.push({
      id: `kanpo_${ctx.player.id}_${blackCard.id}`,
      name: 'kanpo',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: [ctx.player.id],
      duration: 'phase',
      properties: {
        convertedCardId: blackCard.id,
        treatedAs: '无懈可击',
      },
    });
  },
};

export const shu019Skills: SkillPlugin[] = [huoji, kanpo];
