/**
 * SHU043 简雍 (Jian Yong)
 *
 * 巧说 (Qiaoshuo / Silver Tongue): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const qiaoshuo: SkillPlugin = {
  id: 'qiaoshuo',
  name: '巧说',
  generalId: 'SHU043' as GeneralId,
  type: 'active',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu043Skills: SkillPlugin[] = [qiaoshuo];
