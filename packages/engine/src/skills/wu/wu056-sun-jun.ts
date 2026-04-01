/**
 * WU056 孙峻 — 夺锋 (Duofeng / Seize the Edge)
 * Active skill. Once per turn, you may discard 1 card to deal 1 damage
 * to a player within your attack range.
 *
 * 弑亲 (Shiqin / Regicide)
 * Limited skill. You may discard 2 cards to kill a player at 1 HP.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU056_GENERAL_ID = 'WU056' as GeneralId;

export const duofeng: SkillPlugin = {
  id: 'duofeng',
  name: '夺锋',
  generalId: WU056_GENERAL_ID,
  type: 'active',
  description: 'Discard 1 card to deal 1 damage to a player in range.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return (
      ctx.player.handCards.length > 0 &&
      (ctx.player.marks['duofeng_used'] ?? 0) === 0
    );
  },
  activate(ctx) {
    ctx.player.marks['duofeng_used'] = 1;
    if (ctx.player.handCards.length > 0) {
      ctx.discardCards(ctx.player, [ctx.player.handCards[0]!]);
    }
    const targets = ctx.event.type === 'playCard' ? (ctx.event.targets ?? []) : [];
    const target = ctx.game.players.find(p => targets.includes(p.id));
    if (target) {
      ctx.dealDamage(ctx.player, target, 1);
    }
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.handCards.length >= 2; },
    selectTargets(_ctx, candidates) { return candidates.slice(0, 1); },
  },
};

export const shiqin: SkillPlugin = {
  id: 'shiqin',
  name: '弑亲',
  generalId: WU056_GENERAL_ID,
  type: 'limited',
  description: 'Discard 2 cards to eliminate a player at 1 HP.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return (
      ctx.player.handCards.length >= 2 &&
      (ctx.player.marks['shiqin_used'] ?? 0) === 0
    );
  },
  activate(ctx) {
    ctx.player.marks['shiqin_used'] = 1;
    if (ctx.player.handCards.length >= 2) {
      ctx.discardCards(ctx.player, ctx.player.handCards.slice(0, 2));
    }
    const targets = ctx.event.type === 'playCard' ? (ctx.event.targets ?? []) : [];
    const target = ctx.game.players.find(p => targets.includes(p.id) && p.hp <= 1);
    if (target) {
      ctx.dealDamage(ctx.player, target, target.hp);
    }
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.handCards.length >= 3; },
    selectTargets(_ctx, candidates) { return candidates.slice(0, 1); },
  },
};
