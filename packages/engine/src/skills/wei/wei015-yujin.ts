/**
 * WEI015 于禁 (Yu Jin)
 *
 * 镇军 (Garrison / Zhenjun): Play phase skill (details pending).
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const zhenjun: SkillPlugin = {
  id: 'skill_zhenjun',
  name: '镇军',
  generalId: 'general_yujin' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['phaseChange'],

  // TODO: Skill description pending in source data
  canActivate: () => false,

  activate() {
    /* Awaiting complete skill specification */
  },
};

export const wei015Skills: SkillPlugin[] = [zhenjun];
