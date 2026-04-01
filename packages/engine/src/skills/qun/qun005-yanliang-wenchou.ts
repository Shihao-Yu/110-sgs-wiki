/**
 * QUN005 颜良&文丑 (Yan Liang & Wen Chou) — 双壁名将
 *
 * 双雄 (Dual Heroes / Shuangxiong): During draw phase, you may forgo
 * your normal draw and instead flip a judgment card. If the card is red,
 * you take it and keep it. If black, all opponents must give you a card
 * or take 1 damage.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN005 = 'QUN005' as GeneralId;

/**
 * 双雄 — Draw phase: flip judgment; red = keep card, black = opponents give a card.
 */
export const shuangxiong: SkillPlugin = {
  id: 'qun_shuangxiong',
  name: '双雄',
  generalId: QUN005,
  type: 'active',
  description:
    '摸牌阶段，你可以放弃摸牌，改为进行一次判定：若为红色，你获得此牌；若为黑色，其他角色须交给你一张牌或受到1点伤害。',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'draw') return false;
    if (ctx.event.player !== ctx.player.id) return false;
    return ctx.game.drawPile.length > 0;
  },

  activate(ctx) {
    if (ctx.game.drawPile.length === 0) return;

    // Flip a judgment card
    const judgeCard = ctx.game.drawPile.shift()!;
    const isRed = judgeCard.suit === 'heart' || judgeCard.suit === 'diamond';

    if (isRed) {
      // Keep the card
      ctx.player.handCards.push(judgeCard);
    } else {
      // Black: create effect requiring opponents to yield a card
      ctx.game.discardPile.push(judgeCard);
      ctx.game.activeEffects.push({
        id: `shuangxiong_${ctx.game.turnCount}`,
        name: 'shuangxiong',
        sourcePlayerId: ctx.player.id,
        targetPlayerIds: ctx.game.players
          .filter(p => p.alive && p.id !== ctx.player.id)
          .map(p => p.id),
        duration: 'phase',
        properties: { demandCard: true },
      });
    }
  },
};

export const qun005Skills: SkillPlugin[] = [shuangxiong];
