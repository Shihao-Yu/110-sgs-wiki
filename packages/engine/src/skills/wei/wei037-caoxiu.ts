/**
 * WEI037 曹休 (Cao Xiu) — 镝锋破阵
 *
 * 讨袭 (Taoxi): When you use a card to target another player and this is the
 * only target, you may look at that player's hand and take one card; at end
 * of turn, if you still have it, you lose 1 HP.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const taoxi: SkillPlugin = {
  id: 'skill_taoxi',
  name: '讨袭',
  generalId: 'general_wei_038' as GeneralId,
  type: 'passive',
  description:
    '当你使用牌指定其他角色为唯一目标时，你可以观看其手牌并获得一张；若此回合结束时你仍拥有此牌，你失去1点体力。',
  triggers: ['phaseChange'],

  // TODO: Requires card-targeting, hand-view, and end-of-turn tracking
  canActivate: () => false,

  activate() {
    /* Awaiting card-targeting infrastructure */
  },
};

export const wei037Skills: SkillPlugin[] = [taoxi];
