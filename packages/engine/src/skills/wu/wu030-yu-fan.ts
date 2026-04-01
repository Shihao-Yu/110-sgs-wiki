/**
 * WU030 虞翻 — 纵玄 (Zongxuan / Mystic Control)
 * Passive skill. Whenever a card enters the discard pile from your area,
 * you may place it on top of the draw pile instead.
 *
 * 直言 (Zhiyan / Blunt Words)
 * Lock skill. At the end of your turn, you draw 1 card and show it.
 * If it is an equipment card, you may give it to another player and recover 1 HP.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU030_GENERAL_ID = 'WU030' as GeneralId;

export const zongxuan: SkillPlugin = {
  id: 'zongxuan',
  name: '纵玄',
  generalId: WU030_GENERAL_ID,
  type: 'passive',
  description: 'When your cards are discarded, you may place them on top of the draw pile.',
  triggers: ['discardCards'],
  canActivate(ctx) {
    if (ctx.event.type !== 'discardCards') return false;
    return ctx.event.player === ctx.player.id && ctx.event.cards.length > 0;
  },
  activate(ctx) {
    if (ctx.event.type !== 'discardCards') return;
    // Move discarded cards to top of draw pile instead
    for (const card of ctx.event.cards) {
      const idx = ctx.game.discardPile.findIndex(c => c.id === card.id);
      if (idx !== -1) {
        ctx.game.discardPile.splice(idx, 1);
        ctx.game.drawPile.unshift(card);
      }
    }
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};

export const zhiyan: SkillPlugin = {
  id: 'zhiyan',
  name: '直言',
  generalId: WU030_GENERAL_ID,
  type: 'lock',
  description: 'At end of turn, draw 1 card. If equipment, may give it to another player and recover 1 HP.',
  triggers: ['phaseChange'],
  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    return ctx.event.player === ctx.player.id && ctx.event.phase === 'end';
  },
  activate(ctx) {
    ctx.drawCards(ctx.player, 1);
    const drawn = ctx.player.handCards[ctx.player.handCards.length - 1];
    if (drawn && drawn.type === 'equipment' && ctx.player.hp < ctx.player.maxHp) {
      ctx.player.hp += 1;
    }
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};
