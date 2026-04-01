/**
 * WU058 诸葛瑾 — 缓释 (Huanshi / Gentle Resolve)
 * Passive skill. When a player within your attack range performs a
 * judgment, you may show 1 card from your hand and replace the judgment
 * card with it.
 *
 * 弘援 (Hongyuan / Generous Aid)
 * Passive skill. During your draw phase, you may draw 1 fewer card to
 * let up to 2 other players each draw 1 card.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU058_GENERAL_ID = 'WU058' as GeneralId;

export const huanshi: SkillPlugin = {
  id: 'huanshi',
  name: '缓释',
  generalId: WU058_GENERAL_ID,
  type: 'passive',
  description: 'Replace a nearby player\'s judgment card with a card from your hand.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return ctx.player.handCards.length > 0;
  },
  activate(ctx) {
    if (ctx.player.handCards.length > 0) {
      ctx.discardCards(ctx.player, [ctx.player.handCards[0]!]);
    }
    // Simplified: draw 1 card as compensation for the exchange
    ctx.drawCards(ctx.player, 1);
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.handCards.length >= 2; },
    selectTargets() { return []; },
  },
};

export const hongyuan: SkillPlugin = {
  id: 'hongyuan',
  name: '弘援',
  generalId: WU058_GENERAL_ID,
  type: 'passive',
  description: 'During draw phase, draw 1 fewer to let up to 2 others each draw 1.',
  triggers: ['drawCards'],
  canActivate(ctx) {
    if (ctx.event.type !== 'drawCards') return false;
    return ctx.event.player === ctx.player.id && ctx.event.count >= 2;
  },
  activate(ctx) {
    // Draw 1 fewer card for self; 2 allies each draw 1
    const allies = ctx.game.players.filter(
      p => p.id !== ctx.player.id && p.alive,
    );
    for (const ally of allies.slice(0, 2)) {
      ctx.drawCards(ally, 1);
    }
  },
  ai: {
    shouldActivate(ctx) {
      return ctx.game.players.filter(p => p.id !== ctx.player.id && p.alive).length >= 2;
    },
    selectTargets() { return []; },
  },
};
