/**
 * QUN002 吕布 (Lv Bu) — 武的化身
 *
 * 无双 (Unrivaled / Wushuang): Your 杀 (Slash) requires the target to play
 * 2 闪 (Dodge) cards to evade. In a 决斗 (Duel), the opposing player must
 * play 2 杀 per round instead of 1.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN002 = 'QUN002' as GeneralId;

/**
 * 无双 — Slash requires 2 dodges; Duel requires 2 slashes per round.
 * Modeled as an active effect when playing attack cards.
 */
export const wushuang: SkillPlugin = {
  id: 'qun_wushuang',
  name: '无双',
  generalId: QUN002,
  type: 'passive',
  description:
    '锁定技，你的【杀】需两张【闪】才能抵消；与你【决斗】的角色每次需打出两张【杀】。',
  triggers: ['playCard'],

  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    if (ctx.event.player !== ctx.player.id) return false;

    const cardName = ctx.event.card.name;
    return cardName === '杀' || cardName === '决斗';
  },

  activate(ctx) {
    if (ctx.event.type !== 'playCard') return;

    const cardName = ctx.event.card.name;
    const targets = ctx.event.targets ?? [];

    if (cardName === '杀') {
      // Slash requires 2 dodges to evade
      ctx.game.activeEffects.push({
        id: `wushuang_slash_${ctx.game.turnCount}`,
        name: 'wushuang',
        sourcePlayerId: ctx.player.id,
        targetPlayerIds: targets,
        duration: 'phase',
        properties: { requireDoubleDodge: true },
      });
    } else if (cardName === '决斗') {
      // Duel requires 2 slashes per round
      ctx.game.activeEffects.push({
        id: `wushuang_duel_${ctx.game.turnCount}`,
        name: 'wushuang',
        sourcePlayerId: ctx.player.id,
        targetPlayerIds: targets,
        duration: 'phase',
        properties: { requireDoubleSlash: true },
      });
    }
  },
};

export const qun002Skills: SkillPlugin[] = [wushuang];
