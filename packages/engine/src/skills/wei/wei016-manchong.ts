/**
 * WEI016 满宠 (Man Chong)
 *
 * 峻刑 (Severe Punishment / Junxing): During play phase (once), discard
 * hand cards and select another player — that player must discard a card
 * of a type different from all you discarded, or be flipped face-down.
 *
 * 御策 (Imperial Strategy / Yuce): After taking damage, reveal a hand card.
 * If the source doesn't discard a card of a different type, you recover 1 HP.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const junxing: SkillPlugin = {
  id: 'skill_junxing',
  name: '峻刑',
  generalId: 'general_manchong' as GeneralId,
  type: 'active',
  description:
    '出牌阶段限一次，你可以弃置至少一张手牌并选择一名其他角色。',
  triggers: ['phaseChange'],

  // TODO: Requires card-type comparison and flip infrastructure
  canActivate: () => false,

  activate() {
    /* Awaiting card-type comparison infrastructure */
  },
};

export const yuce: SkillPlugin = {
  id: 'skill_yuce',
  name: '御策',
  generalId: 'general_manchong' as GeneralId,
  type: 'passive',
  description:
    '当你受到伤害后，你可以展示一张手牌，若伤害来源不弃置与该牌类别不同的一张手牌，你回复1点体力。',
  triggers: ['damage'],

  // TODO: Requires card-reveal and type-comparison infrastructure
  canActivate: () => false,

  activate() {
    /* Awaiting card reveal infrastructure */
  },
};

export const wei016Skills: SkillPlugin[] = [junxing, yuce];
