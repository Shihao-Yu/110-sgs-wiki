/**
 * QUN006 董卓 (Dong Zhuo) — 魔王
 *
 * 酒池 (Wine Pool / Jiuchi): You may use any spade hand card as 酒 (Wine).
 *
 * 肉林 (Meat Forest / Roulin): Your 杀 targeting female characters requires
 * 2 闪 to dodge (compulsory).
 *
 * 崩坏 (Collapse / Benghuai): At end phase, if your HP is the highest among
 * all players, you must lose 1 HP or discard 1 equipment card.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN006 = 'QUN006' as GeneralId;

/**
 * 酒池 — Use any spade card as 酒 (Wine).
 */
export const jiuchi: SkillPlugin = {
  id: 'qun_jiuchi',
  name: '酒池',
  generalId: QUN006,
  type: 'active',
  description: '你可以将一张黑桃手牌当【酒】使用。',
  triggers: ['playCard'],

  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    if (ctx.event.player !== ctx.player.id) return false;
    return ctx.player.handCards.some(c => c.suit === 'spade');
  },

  activate(ctx) {
    const spadeIdx = ctx.player.handCards.findIndex(c => c.suit === 'spade');
    if (spadeIdx === -1) return;

    const [spadeCard] = ctx.player.handCards.splice(spadeIdx, 1);
    ctx.game.discardPile.push(spadeCard);

    // Model as wine effect
    ctx.game.activeEffects.push({
      id: `jiuchi_${ctx.game.turnCount}`,
      name: 'jiuchi',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: [ctx.player.id],
      duration: 'phase',
      properties: { wineEffect: true, bonusDamage: 1 },
    });
  },
};

/**
 * 肉林 — Your 杀 to female characters requires 2 闪.
 */
export const roulin: SkillPlugin = {
  id: 'qun_roulin',
  name: '肉林',
  generalId: QUN006,
  type: 'passive',
  description:
    '锁定技，你对女性角色使用的【杀】需两张【闪】才能抵消。',
  triggers: ['playCard'],

  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    if (ctx.event.player !== ctx.player.id) return false;
    return ctx.event.card.name === '杀';
  },

  activate(ctx) {
    if (ctx.event.type !== 'playCard') return;
    const targets = ctx.event.targets ?? [];

    ctx.game.activeEffects.push({
      id: `roulin_${ctx.game.turnCount}`,
      name: 'roulin',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: targets,
      duration: 'phase',
      properties: { requireDoubleDodgeFemale: true },
    });
  },
};

/**
 * 崩坏 — End phase: if highest HP, lose 1 HP or discard 1 equipment.
 */
export const benghuai: SkillPlugin = {
  id: 'qun_benghuai',
  name: '崩坏',
  generalId: QUN006,
  type: 'passive',
  description:
    '锁定技，结束阶段，若你的体力值为全场最大或之一，你须减1点体力或弃置一张装备牌。',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'end') return false;
    if (ctx.event.player !== ctx.player.id) return false;

    // Check if HP is highest (or tied for highest)
    const maxHp = Math.max(
      ...ctx.game.players.filter(p => p.alive).map(p => p.hp),
    );
    return ctx.player.hp >= maxHp;
  },

  activate(ctx) {
    // Lose 1 HP (simplified: in full impl, player would choose)
    ctx.player.hp -= 1;
  },
};

export const qun006Skills: SkillPlugin[] = [jiuchi, roulin, benghuai];
