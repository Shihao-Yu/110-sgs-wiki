/**
 * SHU036 关兴 (Guan Xing, individual)
 *
 * 龙吟 (Longyin / Dragon's Cry): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const longyin: SkillPlugin = {
  id: 'longyin',
  name: '龙吟',
  generalId: 'SHU036' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['playCard'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu036Skills: SkillPlugin[] = [longyin];
