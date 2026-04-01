/**
 * WU026 顾雍 — 秉壹 (Bingyi / Uphold Unity)
 * Active skill. At end phase, show all your hand cards. If all same color
 * (all red or all black), you may give each to different players.
 *
 * 慎行 (Shenxing / Cautious Travel)
 * Active skill. Discard 2 cards to draw 1 card.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU026_GENERAL_ID = 'WU026' as GeneralId;

export const shenxing: SkillPlugin = {
  id: 'shenxing',
  name: '慎行',
  generalId: WU026_GENERAL_ID,
  type: 'active',
  description: 'Discard 2 cards to draw 1 card.',
  triggers: ['useSkill'],
  canActivate(ctx) {
    if (ctx.event.type !== 'useSkill') return false;
    return ctx.player.handCards.length >= 2;
  },
  activate(ctx) {
    const toDiscard = ctx.player.handCards.slice(0, 2);
    ctx.discardCards(ctx.player, toDiscard);
    ctx.drawCards(ctx.player, 1);
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.handCards.length >= 4; },
    selectTargets() { return []; },
  },
};

export const bingyi: SkillPlugin = {
  id: 'bingyi',
  name: '秉壹',
  generalId: WU026_GENERAL_ID,
  type: 'active',
  description: 'At end phase, show hand. If all same color, distribute to other players.',
  triggers: ['phaseChange'],
  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'end') return false;
    if (ctx.player.handCards.length === 0) return false;
    const isBlack = (s: string) => s === 'spade' || s === 'club';
    const isRed = (s: string) => s === 'heart' || s === 'diamond';
    return (
      ctx.player.handCards.every(c => isBlack(c.suit)) ||
      ctx.player.handCards.every(c => isRed(c.suit))
    );
  },
  activate(ctx) {
    // Distribute 1 card to each alive player
    const others = ctx.game.players.filter(p => p.id !== ctx.player.id && p.alive);
    for (const other of others) {
      if (ctx.player.handCards.length === 0) break;
      const card = ctx.player.handCards.shift()!;
      other.handCards.push(card);
    }
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.handCards.length >= 2; },
    selectTargets() { return []; },
  },
};
