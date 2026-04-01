/**
 * WEI013 徐晃 (Xu Huang) — listed as general_xuzhu_sp in data
 *
 * 断粮 (Cut Provisions / Duanliang): You may use a black basic or equipment
 * card as 兵粮寸断 (Supply Shortage). Your Supply Shortage has no distance limit.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const duanliang: SkillPlugin = {
  id: 'skill_duanliang',
  name: '断粮',
  generalId: 'general_xuzhu_sp' as GeneralId,
  type: 'active',
  description:
    '你可以将一张黑色基本牌或黑色装备牌当【兵粮寸断】使用；你对其他角色使用【兵粮寸断】时无距离限制。',
  triggers: ['phaseChange'],

  // TODO: Requires card-conversion and delayed-trick infrastructure
  canActivate: () => false,

  activate() {
    /* Awaiting card conversion and delayed trick infrastructure */
  },
};

export const wei013Skills: SkillPlugin[] = [duanliang];
