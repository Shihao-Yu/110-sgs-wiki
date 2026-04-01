/**
 * WEI035 韩浩&史涣 (Han Hao & Shi Huan) — 勇往直前
 *
 * 慕义 (Muyi): When the equip area of any player changes, you may draw 1 card.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const muyi: SkillPlugin = {
  id: 'skill_muyi',
  name: '慕义',
  generalId: 'general_wei_036' as GeneralId,
  type: 'passive',
  description:
    '当一名角色的装备区里的牌发生变化时，你可以摸一张牌。',
  triggers: ['phaseChange'],

  // TODO: Requires equipment-change event tracking
  canActivate: () => false,

  activate() {
    /* Awaiting equipment-change event infrastructure */
  },
};

export const wei035Skills: SkillPlugin[] = [muyi];
