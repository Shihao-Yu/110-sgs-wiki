/**
 * QUN020 田丰 (Tian Feng) — 刚正的直臣
 *
 * 死谏 (Deathed Counsel / Sijian): When you lose a card (except during
 * discard phase), you may discard 1 of another player's cards.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN020 = 'QUN020' as GeneralId;

export const sijian: SkillPlugin = {
  id: 'qun_sijian',
  name: '死谏',
  generalId: QUN020,
  type: 'passive',
  description: '当你失去最后的手牌后，你可以弃置一名其他角色的一张牌。',
  triggers: ['discardCards'],
  canActivate(ctx) {
    if (ctx.event.type !== 'discardCards') return false;
    return ctx.player.handCards.length === 0;
  },
  activate(ctx) {
    const target = ctx.game.players.find(
      p => p.alive && p.id !== ctx.player.id && p.handCards.length > 0,
    );
    if (!target) return;
    const [taken] = target.handCards.splice(0, 1);
    ctx.game.discardPile.push(taken);
  },
};

export const qun020Skills: SkillPlugin[] = [sijian];
