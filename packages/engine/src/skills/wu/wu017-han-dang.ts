/**
 * WU017 韩当 — 弓骑 (Gongqi / Mounted Archery)
 * Passive skill. When your 杀 is dodged, you may discard 1 card. If so,
 * treat the 杀 as having hit.
 *
 * 解烦 (Jiefan / Relieve)
 * Active skill (limited, once per game). Select a player. Other players
 * near them must each discard 1 weapon or that player draws 1 card for each.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU017_GENERAL_ID = 'WU017' as GeneralId;

export const gongqi: SkillPlugin = {
  id: 'gongqi',
  name: '弓骑',
  generalId: WU017_GENERAL_ID,
  type: 'passive',
  description: 'When your 杀 is dodged, discard 1 card to force it to hit.',
  triggers: ['response'],
  canActivate(ctx) {
    if (ctx.event.type !== 'response') return false;
    return ctx.event.accepted && ctx.player.handCards.length > 0;
  },
  activate(ctx) {
    if (ctx.player.handCards.length > 0) {
      ctx.discardCards(ctx.player, [ctx.player.handCards[0]!]);
    }
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.handCards.length >= 2; },
    selectTargets() { return []; },
  },
};

export const jiefan: SkillPlugin = {
  id: 'jiefan',
  name: '解烦',
  generalId: WU017_GENERAL_ID,
  type: 'limited',
  description: 'Once per game, select a player. Others discard weapons or they draw cards.',
  triggers: ['useSkill'],
  canActivate(ctx) {
    if (ctx.event.type !== 'useSkill') return false;
    return (ctx.player.marks['jiefan_used'] ?? 0) === 0;
  },
  activate(ctx) {
    ctx.player.marks['jiefan_used'] = 1;
    if (ctx.event.type !== 'useSkill') return;
    const targets = ctx.event.targets ?? [];
    if (targets.length === 0) return;
    const target = ctx.game.players.find(p => p.id === targets[0]);
    if (!target) return;
    ctx.drawCards(target, 1);
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.hp <= 2; },
    selectTargets(_ctx, candidates) { return candidates.slice(0, 1); },
  },
};
