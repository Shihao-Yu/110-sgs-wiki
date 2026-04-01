/**
 * WU040 孙休 — 诏缚 (Zhaofu / Imperial Arrest)
 * Active skill. Once per turn, you may discard 1 card to let one player
 * use a 杀 against another player as if in range.
 *
 * 危殆 (Weidai / Desperate Plea)
 * Limited skill. When you are dying, other players may show and give you
 * a 桃 or 酒 — they do not use it themselves.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU040_GENERAL_ID = 'WU040' as GeneralId;

export const zhaofu: SkillPlugin = {
  id: 'zhaofu',
  name: '诏缚',
  generalId: WU040_GENERAL_ID,
  type: 'active',
  description: 'Discard 1 card to let one player use Slash against another.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return (
      ctx.player.handCards.length > 0 &&
      (ctx.player.marks['zhaofu_used'] ?? 0) === 0
    );
  },
  activate(ctx) {
    ctx.player.marks['zhaofu_used'] = 1;
    if (ctx.player.handCards.length > 0) {
      ctx.discardCards(ctx.player, [ctx.player.handCards[0]!]);
    }
    // Simplified: deal 1 damage to first valid target
    if (ctx.event.type !== 'playCard') return;
    const targets = ctx.event.targets ?? [];
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

export const weidai: SkillPlugin = {
  id: 'weidai',
  name: '危殆',
  generalId: WU040_GENERAL_ID,
  type: 'limited',
  description: 'When dying, other players may give you a Peach or Wine without using it.',
  triggers: ['loseHp'],
  canActivate(ctx) {
    if (ctx.event.type !== 'loseHp') return false;
    return ctx.player.hp <= 0 && (ctx.player.marks['weidai_used'] ?? 0) === 0;
  },
  activate(ctx) {
    ctx.player.marks['weidai_used'] = 1;
    // Simplified: recover 1 HP as if receiving help
    if (ctx.player.hp < ctx.player.maxHp) {
      ctx.player.hp += 1;
    }
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.hp <= 0; },
    selectTargets() { return []; },
  },
};
