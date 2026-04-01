/**
 * QUN017 孟获 (Meng Huo) — 南蛮王
 *
 * 祸首 (Scapegoat / Huoshou): Immune to 南蛮入侵; damage from 南蛮入侵 is
 * attributed to you.
 * 再起 (Rise Again / Zaiqi): Draw phase, may forgo draw; for each HP lost,
 * flip a card — red = recover 1 HP, black = draw 1 card.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN017 = 'QUN017' as GeneralId;

export const huoshou: SkillPlugin = {
  id: 'qun_huoshou',
  name: '祸首',
  generalId: QUN017,
  type: 'passive',
  description: '锁定技，【南蛮入侵】对你无效；其他角色使用【南蛮入侵】造成的伤害视为由你造成。',
  triggers: ['playCard'],
  canActivate: () => false,
  activate() { /* Requires AoE card resolution infrastructure */ },
};

export const zaiqi: SkillPlugin = {
  id: 'qun_zaiqi',
  name: '再起',
  generalId: QUN017,
  type: 'active',
  description: '摸牌阶段，你可以放弃摸牌，改为亮出牌堆顶等于你已损失体力值数量的牌，回复红色牌数量的体力，获得黑色牌。',
  triggers: ['phaseChange'],
  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'draw') return false;
    if (ctx.event.player !== ctx.player.id) return false;
    return ctx.player.hp < ctx.player.maxHp;
  },
  activate(ctx) {
    const lost = ctx.player.maxHp - ctx.player.hp;
    for (let i = 0; i < lost; i++) {
      if (ctx.game.drawPile.length === 0) break;
      const card = ctx.game.drawPile.shift()!;
      if (card.suit === 'heart' || card.suit === 'diamond') {
        ctx.player.hp = Math.min(ctx.player.hp + 1, ctx.player.maxHp);
        ctx.game.discardPile.push(card);
      } else {
        ctx.player.handCards.push(card);
      }
    }
  },
};

export const qun017Skills: SkillPlugin[] = [huoshou, zaiqi];
