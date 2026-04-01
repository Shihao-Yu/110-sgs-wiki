/**
 * SHU080 卢植 (Lu Zhi — SHU affiliation variant)
 *
 * 师恩 (Shien / Teacher's Grace): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const shien: SkillPlugin = {
  id: 'shien',
  name: '师恩',
  generalId: 'SHU080' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['drawCards'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu080Skills: SkillPlugin[] = [shien];
