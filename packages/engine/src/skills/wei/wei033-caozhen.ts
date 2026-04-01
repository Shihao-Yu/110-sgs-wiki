/**
 * WEI033 曹真 (Cao Zhen) — 骁勇金衔
 *
 * 司敌 (Sidi): After another player plays a card during their play phase,
 * you may discard a card of the same type. If so, that player may not use
 * cards of the same type for the rest of their turn, and at end of turn
 * you may use a Slash against them.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const sidi: SkillPlugin = {
  id: 'skill_sidi',
  name: '司敌',
  generalId: 'general_wei_034' as GeneralId,
  type: 'passive',
  description:
    '其他角色出牌阶段使用一张牌结算后，你可以弃置一张与之类型相同的牌，该角色本回合不能再使用同类牌。',
  triggers: ['phaseChange'],

  // TODO: Requires card-use-interception and per-turn restriction infrastructure
  canActivate: () => false,

  activate() {
    /* Awaiting card-use-interception infrastructure */
  },
};

export const wei033Skills: SkillPlugin[] = [sidi];
