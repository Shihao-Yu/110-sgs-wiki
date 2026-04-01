/**
 * SHU041 马忠 (Ma Zhong)
 *
 * 伏骑 (Fuqi / Ambush Cavalry): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const fuqi: SkillPlugin = {
  id: 'fuqi',
  name: '伏骑',
  generalId: 'SHU041' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu041Skills: SkillPlugin[] = [fuqi];
