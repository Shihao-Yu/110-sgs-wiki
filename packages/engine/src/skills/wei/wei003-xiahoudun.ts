/**
 * WEI003 夏侯惇 (Xiahou Dun) — 独眼的罗刹
 *
 * 刚烈 (Unyielding / Ganglie): After you take damage, you may judge — if
 * the result is not ♥, the damage source must discard 2 hand cards or take
 * 1 damage from you.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const ganglie: SkillPlugin = {
  id: 'skill_ganglie',
  name: '刚烈',
  generalId: 'general_xiahoudun' as GeneralId,
  type: 'passive',
  description:
    '当你受到伤害后，你可以进行判定：若结果不为♥，则伤害来源须弃置两张手牌或受到你造成的1点伤害。',
  triggers: ['damage'],

  canActivate(ctx) {
    if (ctx.event.type !== 'damage') return false;
    if (ctx.event.target !== ctx.player.id) return false;
    return ctx.event.source != null;
  },

  activate(ctx) {
    if (ctx.event.type !== 'damage' || !ctx.event.source) return;
    const source = ctx.game.players.find(p => p.id === ctx.event.source);
    if (!source) return;

    // Perform judgment: draw the top card of the draw pile
    const judgmentCard = ctx.game.drawPile.shift();
    if (!judgmentCard) return;

    ctx.game.discardPile.push(judgmentCard);

    // If not heart, source must discard 2 or take 1 damage
    if (judgmentCard.suit !== 'heart') {
      if (source.handCards.length >= 2) {
        // Discard 2 hand cards (simplified: first 2)
        const discarded = source.handCards.splice(0, 2);
        ctx.discardCards(source, discarded);
      } else {
        // Source takes 1 damage
        ctx.dealDamage(ctx.player, source, 1);
      }
    }
  },
};

export const wei003Skills: SkillPlugin[] = [ganglie];
