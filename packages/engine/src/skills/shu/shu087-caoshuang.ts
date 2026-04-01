/**
 * SHU087 曹爽 (Cao Shuang — SHU affiliation variant)
 *
 * 骄矜 (Jiaojin / Prideful): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const jiaojin: SkillPlugin = {
  id: 'jiaojin',
  name: '骄矜',
  generalId: 'SHU087' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu087Skills: SkillPlugin[] = [jiaojin];
