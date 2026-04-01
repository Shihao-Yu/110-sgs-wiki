/**
 * SHU013 马谡 (Ma Su)
 *
 * 心战 (Xinzhan / Psychological Warfare): At the start of draw phase, if HP
 * is full, you may look at top 3 cards of the draw pile.
 *
 * 挥泪 (Huilei / Tears): When you die, the killer discards all hand cards.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const SHU013 = 'SHU013' as GeneralId;

export const xinzhan: SkillPlugin = {
  id: 'xinzhan',
  name: '心战',
  generalId: SHU013,
  type: 'active',
  description:
    'At the start of draw phase, if at full HP, look at top 3 cards of draw pile.',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'draw') return false;
    return ctx.player.hp === ctx.player.maxHp && ctx.game.drawPile.length > 0;
  },

  activate(ctx) {
    // Look at top 3 cards; in full implementation, present to player
    const lookCount = Math.min(3, ctx.game.drawPile.length);
    const looked = ctx.game.drawPile.splice(0, lookCount);
    // Return cards: keep hearts in hand, put rest back on top
    const hearts = looked.filter((c) => c.suit === 'heart');
    const rest = looked.filter((c) => c.suit !== 'heart');
    ctx.player.handCards.push(...hearts);
    ctx.game.drawPile.unshift(...rest);
  },
};

export const huilei: SkillPlugin = {
  id: 'huilei',
  name: '挥泪',
  generalId: SHU013,
  type: 'passive',
  description: 'When you die, the killer discards all hand cards.',
  triggers: ['death'],

  canActivate(ctx) {
    if (ctx.event.type !== 'death') return false;
    return ctx.event.player === ctx.player.id && ctx.event.killer != null;
  },

  activate(ctx) {
    if (ctx.event.type !== 'death' || !ctx.event.killer) return;
    const killer = ctx.game.players.find((p) => p.id === ctx.event.killer);
    if (!killer || killer.handCards.length === 0) return;
    ctx.discardCards(killer, [...killer.handCards]);
  },
};

export const shu013Skills: SkillPlugin[] = [xinzhan, huilei];
