/**
 * WEI018 张春华 (Zhang Chunhua)
 *
 * 绝情 (Heartless / Jueqing): Compulsory — all damage you deal is treated
 * as HP loss instead (bypasses armor, damage prevention, etc.).
 *
 * 伤逝 (Grief / Shangshi): When your hand card count is less than your
 * lost HP, you may draw until your hand equals your lost HP.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const jueqing: SkillPlugin = {
  id: 'skill_jueqing',
  name: '绝情',
  generalId: 'general_zhangchunhua' as GeneralId,
  type: 'lock',
  description: '锁定技，你造成的伤害均视为体力流失。',
  triggers: ['damage'],

  canActivate(ctx) {
    if (ctx.event.type !== 'damage') return false;
    return ctx.event.source === ctx.player.id;
  },

  activate(ctx) {
    // Convert damage to HP loss — the target loses HP directly without
    // triggering damage-reaction skills (like armor, Ren Wang Shield, etc.)
    if (ctx.event.type !== 'damage') return;
    const target = ctx.game.players.find(p => p.id === ctx.event.target);
    if (!target) return;
    target.hp -= ctx.event.amount;
  },
};

export const shangshi: SkillPlugin = {
  id: 'skill_shangshi',
  name: '伤逝',
  generalId: 'general_zhangchunhua' as GeneralId,
  type: 'passive',
  description:
    '当你的手牌数小于你已损失的体力值时，你可以将手牌补至等于你已损失的体力值。',
  triggers: ['damage', 'discardCards'],

  canActivate(ctx) {
    const lostHp = ctx.player.maxHp - ctx.player.hp;
    return ctx.player.handCards.length < lostHp;
  },

  activate(ctx) {
    const lostHp = ctx.player.maxHp - ctx.player.hp;
    const deficit = lostHp - ctx.player.handCards.length;
    if (deficit > 0) {
      ctx.drawCards(ctx.player, deficit);
    }
  },
};

export const wei018Skills: SkillPlugin[] = [jueqing, shangshi];
