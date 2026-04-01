/**
 * WU042 孙皓 — 灭吴 (Miewu / Wu's Demise)
 * Active skill. You may show and discard 1 hand card to use any basic or
 * non-delayed trick card (of matching color) from outside the game.
 *
 * 残暴 (Canbao / Tyranny)
 * Lock skill. When you deal damage, draw 1 card from the damage pile.
 * When another player is killed, draw 3 cards.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU042_GENERAL_ID = 'WU042' as GeneralId;

export const miewu: SkillPlugin = {
  id: 'miewu',
  name: '灭吴',
  generalId: WU042_GENERAL_ID,
  type: 'active',
  description: 'Discard 1 card to use any basic/trick card of matching color.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return ctx.player.handCards.length > 0;
  },
  activate(ctx) {
    if (ctx.player.handCards.length > 0) {
      ctx.discardCards(ctx.player, [ctx.player.handCards[0]!]);
    }
    // Simplified: draw 1 card as substitute for converted card usage
    ctx.drawCards(ctx.player, 1);
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.handCards.length >= 3; },
    selectTargets() { return []; },
  },
};

export const canbao: SkillPlugin = {
  id: 'canbao',
  name: '残暴',
  generalId: WU042_GENERAL_ID,
  type: 'lock',
  description: 'When you deal damage, draw 1 card. When a player dies, draw 3 cards.',
  triggers: ['damage', 'death'],
  canActivate(ctx) {
    if (ctx.event.type === 'damage') return ctx.event.source === ctx.player.id;
    if (ctx.event.type === 'death') return ctx.event.player !== ctx.player.id;
    return false;
  },
  activate(ctx) {
    if (ctx.event.type === 'damage') {
      ctx.drawCards(ctx.player, 1);
    } else if (ctx.event.type === 'death') {
      ctx.drawCards(ctx.player, 3);
    }
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};
