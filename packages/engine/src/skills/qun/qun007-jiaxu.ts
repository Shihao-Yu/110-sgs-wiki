/**
 * QUN007 贾诩 (Jia Xu) — 毒士
 *
 * 帷幕 (Curtain / Weimu): Compulsory — you are immune to black-suited
 * trick cards (锦囊牌).
 *
 * 完杀 (Complete Kill / Wansha): Compulsory — during your turn, only the
 * player who is dying may use 桃 (Peach) to save themselves; other players
 * cannot use 桃 to save the dying player.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN007 = 'QUN007' as GeneralId;

/**
 * 帷幕 — Immune to black trick cards (compulsory).
 */
export const weimu: SkillPlugin = {
  id: 'qun_weimu',
  name: '帷幕',
  generalId: QUN007,
  type: 'passive',
  description:
    '锁定技，你不能成为黑色锦囊牌的目标。',
  triggers: ['playCard'],

  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    const card = ctx.event.card;
    const targets = ctx.event.targets ?? [];

    // Check if this player is a target of a black trick card
    if (card.type !== 'trick') return false;
    if (card.suit !== 'spade' && card.suit !== 'club') return false;
    return targets.includes(ctx.player.id);
  },

  activate(ctx) {
    if (ctx.event.type !== 'playCard') return;

    // Add immunity effect
    ctx.game.activeEffects.push({
      id: `weimu_${ctx.game.turnCount}`,
      name: 'weimu',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: [ctx.player.id],
      duration: 'permanent',
      properties: { immuneBlackTrick: true },
    });
  },
};

/**
 * 完杀 — During your turn, only the dying player can save themselves.
 */
export const wansha: SkillPlugin = {
  id: 'qun_wansha',
  name: '完杀',
  generalId: QUN007,
  type: 'passive',
  description:
    '锁定技，你的回合内，除濒死角色本人外的其他角色不能使用【桃】。',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'play') return false;
    return ctx.event.player === ctx.player.id;
  },

  activate(ctx) {
    ctx.game.activeEffects.push({
      id: `wansha_${ctx.game.turnCount}`,
      name: 'wansha',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: ctx.game.players
        .filter(p => p.alive && p.id !== ctx.player.id)
        .map(p => p.id),
      duration: 'turn',
      properties: { peachRestriction: true },
    });
  },
};

export const qun007Skills: SkillPlugin[] = [weimu, wansha];
