/**
 * WU024 孙鲁育 — 秘戎 (Mirong / Secret War)
 * Active skill. Once per turn, select a player and a basic card name.
 * That player must use/play that card or give you 1 card.
 *
 * 密信 (Mixin / Secret Message)
 * Passive skill. When you use a trick card, you may draw 1 card.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU024_GENERAL_ID = 'WU024' as GeneralId;

export const mirong: SkillPlugin = {
  id: 'mirong',
  name: '秘戎',
  generalId: WU024_GENERAL_ID,
  type: 'active',
  description: 'Name a basic card. A player must play it or give you 1 card.',
  triggers: ['useSkill'],
  canActivate(ctx) {
    if (ctx.event.type !== 'useSkill') return false;
    return (ctx.player.marks['mirong_used'] ?? 0) === 0;
  },
  activate(ctx) {
    ctx.player.marks['mirong_used'] = 1;
    if (ctx.event.type !== 'useSkill') return;
    const targets = ctx.event.targets ?? [];
    if (targets.length === 0) return;
    const target = ctx.game.players.find(p => p.id === targets[0]);
    if (!target || target.handCards.length === 0) return;
    // Simplified: target gives 1 card
    const card = target.handCards.shift()!;
    ctx.player.handCards.push(card);
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets(_ctx, candidates) { return candidates.slice(0, 1); },
  },
};

export const mixin: SkillPlugin = {
  id: 'mixin',
  name: '密信',
  generalId: WU024_GENERAL_ID,
  type: 'passive',
  description: 'When you use a trick card, draw 1 card.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return ctx.event.player === ctx.player.id && ctx.event.card.type === 'trick';
  },
  activate(ctx) {
    ctx.drawCards(ctx.player, 1);
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};
