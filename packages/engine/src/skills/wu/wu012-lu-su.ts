/**
 * WU012 鲁肃 — 好施 (Haoshi / Generosity)
 * Lock skill. During draw phase, draw 2 extra cards. If your hand exceeds 5,
 * you must give half (rounded down) to the player with fewest hand cards.
 *
 * 缔盟 (Dimeng / Alliance)
 * Active skill (once per turn). Select 2 other players and swap their hand cards.
 * You must discard cards equal to the difference in hand sizes.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU012_GENERAL_ID = 'WU012' as GeneralId;

export const haoshi: SkillPlugin = {
  id: 'haoshi',
  name: '好施',
  generalId: WU012_GENERAL_ID,
  type: 'lock',
  description:
    'Draw 2 extra cards in draw phase. If hand > 5, give half to the player with fewest cards.',
  triggers: ['drawCards'],

  canActivate(ctx) {
    if (ctx.event.type !== 'drawCards') return false;
    return ctx.event.player === ctx.player.id;
  },

  activate(ctx) {
    ctx.drawCards(ctx.player, 2);

    if (ctx.player.handCards.length > 5) {
      const giveCount = Math.floor(ctx.player.handCards.length / 2);
      const poorest = ctx.game.players
        .filter(p => p.id !== ctx.player.id && p.alive)
        .sort((a, b) => a.handCards.length - b.handCards.length)[0];

      if (poorest) {
        const given = ctx.player.handCards.splice(0, giveCount);
        poorest.handCards.push(...given);
      }
    }
  },

  ai: {
    shouldActivate() {
      return true;
    },
    selectTargets() {
      return [];
    },
  },
};

export const dimeng: SkillPlugin = {
  id: 'dimeng',
  name: '缔盟',
  generalId: WU012_GENERAL_ID,
  type: 'active',
  description:
    'Select 2 players and swap their hand cards. Discard cards equal to the hand size difference.',
  triggers: ['useSkill'],

  canActivate(ctx) {
    if (ctx.event.type !== 'useSkill') return false;
    return (ctx.player.marks['dimeng_used'] ?? 0) === 0;
  },

  activate(ctx) {
    ctx.player.marks['dimeng_used'] = 1;
    if (ctx.event.type !== 'useSkill') return;

    const targets = ctx.event.targets ?? [];
    if (targets.length < 2) return;

    const p1 = ctx.game.players.find(p => p.id === targets[0]);
    const p2 = ctx.game.players.find(p => p.id === targets[1]);
    if (!p1 || !p2) return;

    const diff = Math.abs(p1.handCards.length - p2.handCards.length);
    if (ctx.player.handCards.length < diff) return;

    // Discard the cost
    const cost = ctx.player.handCards.splice(0, diff);
    ctx.discardCards(ctx.player, cost);

    // Swap hands
    const temp = p1.handCards;
    p1.handCards = p2.handCards;
    p2.handCards = temp;
  },

  ai: {
    shouldActivate(ctx) {
      return ctx.player.handCards.length >= 2;
    },
    selectTargets(_ctx, candidates) {
      return candidates.slice(0, 2);
    },
  },
};
