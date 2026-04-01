/**
 * QUN008 庞德 (Pang De) — 抬棺决死
 *
 * 马术 (Horsemanship / Mashu): Your distance to other players is reduced by 1.
 *
 * 猛进 (Advance / Mengjin): When your 杀 (Slash) is dodged by the target,
 * you may discard 1 card from the target's area (hand or equipment).
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN008 = 'QUN008' as GeneralId;

/**
 * 马术 — Compulsory distance reduction by 1.
 */
export const mashuPangde: SkillPlugin = {
  id: 'qun_mashu_pangde',
  name: '马术',
  generalId: QUN008,
  type: 'passive',
  description: '锁定技，你计算与其他角色的距离时始终-1。',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'prepare') return false;
    return ctx.event.player === ctx.player.id;
  },

  activate(ctx) {
    // Check if effect already exists to avoid duplication
    const existing = ctx.game.activeEffects.find(
      e => e.name === 'mashu_pangde' && e.sourcePlayerId === ctx.player.id,
    );
    if (existing) return;

    ctx.game.activeEffects.push({
      id: `mashu_pangde_${ctx.player.id}`,
      name: 'mashu_pangde',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: [ctx.player.id],
      duration: 'permanent',
      properties: { distanceReduction: 1 },
    });
  },
};

/**
 * 猛进 — When 杀 is dodged, discard 1 of the target's cards.
 */
export const mengjin: SkillPlugin = {
  id: 'qun_mengjin',
  name: '猛进',
  generalId: QUN008,
  type: 'passive',
  description:
    '当你使用的【杀】被目标角色使用的【闪】抵消后，你可以弃置该角色的一张牌。',
  triggers: ['response'],

  canActivate(ctx) {
    if (ctx.event.type !== 'response') return false;
    // The response must be an accepted dodge against our slash
    return ctx.event.accepted;
  },

  activate(ctx) {
    if (ctx.event.type !== 'response') return;

    // Find the responding player
    const target = ctx.game.players.find(p => p.id === ctx.event.player);
    if (!target || !target.alive) return;

    // Discard 1 card from the target
    if (target.handCards.length > 0) {
      const [taken] = target.handCards.splice(0, 1);
      ctx.game.discardPile.push(taken);
    }
  },
};

export const qun008Skills: SkillPlugin[] = [mashuPangde, mengjin];
