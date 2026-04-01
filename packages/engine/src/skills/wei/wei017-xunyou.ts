/**
 * WEI017 荀攸 (Xun You)
 *
 * 奇策 (Brilliant Strategy / Qice): During play phase (once), use all hand
 * cards (at least one) as any non-delayed trick card.
 *
 * 智愚 (Wisdom and Folly / Zhiyu): After taking damage, draw 1 card and
 * reveal all hand cards. If they are all the same color, the source discards
 * a hand card.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const qice: SkillPlugin = {
  id: 'skill_qice',
  name: '奇策',
  generalId: 'general_xunyou' as GeneralId,
  type: 'active',
  description:
    '出牌阶段限一次，你可以将所有手牌（至少一张）当任意一张非延时锦囊牌使用。',
  triggers: ['phaseChange'],

  // TODO: Requires virtual card and trick card infrastructure
  canActivate: () => false,

  activate() {
    /* Awaiting virtual trick card infrastructure */
  },
};

export const zhiyu: SkillPlugin = {
  id: 'skill_zhiyu',
  name: '智愚',
  generalId: 'general_xunyou' as GeneralId,
  type: 'passive',
  description:
    '当你受到伤害后，你可以摸一张牌并展示所有手牌：若颜色均相同，伤害来源弃置一张手牌。',
  triggers: ['damage'],

  canActivate(ctx) {
    if (ctx.event.type !== 'damage') return false;
    return ctx.event.target === ctx.player.id;
  },

  activate(ctx) {
    ctx.drawCards(ctx.player, 1);

    // Check if all hand cards are the same color
    if (ctx.player.handCards.length === 0) return;
    const isBlack = (suit: string) => suit === 'spade' || suit === 'club';
    const firstBlack = isBlack(ctx.player.handCards[0].suit);
    const allSameColor = ctx.player.handCards.every(
      c => isBlack(c.suit) === firstBlack,
    );

    if (allSameColor && ctx.event.type === 'damage' && ctx.event.source) {
      const source = ctx.game.players.find(p => p.id === ctx.event.source);
      if (source && source.handCards.length > 0) {
        const discarded = source.handCards.splice(0, 1);
        ctx.discardCards(source, discarded);
      }
    }
  },
};

export const wei017Skills: SkillPlugin[] = [qice, zhiyu];
