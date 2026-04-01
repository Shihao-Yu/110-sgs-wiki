/**
 * SHU055 张鲁 (Zhang Lu)
 *
 * 义舍 (Yishe / Righteous Shelter): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const yishe: SkillPlugin = {
  id: 'yishe',
  name: '义舍',
  generalId: 'SHU055' as GeneralId,
  type: 'active',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu055Skills: SkillPlugin[] = [yishe];
