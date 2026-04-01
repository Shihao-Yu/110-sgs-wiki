/**
 * QUN011 庞统 (Pang Tong) — 凤雏
 *
 * 连环 (Chain / Lianhuan): Use a club card as 铁索连环 (Iron Chain).
 * 涅槃 (Nirvana / Niepan): When dying, discard all cards/equipment, flip
 * face-up, reset HP, draw 3 cards. Once per game.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN011 = 'QUN011' as GeneralId;

export const lianhuan: SkillPlugin = {
  id: 'qun_lianhuan',
  name: '连环',
  generalId: QUN011,
  type: 'active',
  description: '你可以将一张梅花手牌当【铁索连环】使用。',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    if (ctx.event.player !== ctx.player.id) return false;
    return ctx.player.handCards.some(c => c.suit === 'club');
  },
  activate(ctx) {
    const clubIdx = ctx.player.handCards.findIndex(c => c.suit === 'club');
    if (clubIdx === -1) return;
    const [clubCard] = ctx.player.handCards.splice(clubIdx, 1);
    ctx.game.discardPile.push(clubCard);
    ctx.game.activeEffects.push({
      id: `lianhuan_${ctx.game.turnCount}`,
      name: 'lianhuan',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: [],
      duration: 'phase',
      properties: { ironChain: true },
    });
  },
};

export const niepan: SkillPlugin = {
  id: 'qun_niepan',
  name: '涅槃',
  generalId: QUN011,
  type: 'passive',
  description: '限定技，当你处于濒死状态时，弃置所有牌，复原体力，摸三张牌。',
  triggers: ['loseHp'],
  canActivate(ctx) {
    if (ctx.event.type !== 'loseHp') return false;
    return ctx.player.hp <= 0 && (ctx.player.marks['niepan_used'] ?? 0) === 0;
  },
  activate(ctx) {
    ctx.player.marks['niepan_used'] = 1;
    ctx.discardCards(ctx.player, [...ctx.player.handCards]);
    ctx.player.hp = ctx.player.maxHp;
    ctx.drawCards(ctx.player, 3);
  },
};

export const qun011Skills: SkillPlugin[] = [lianhuan, niepan];
