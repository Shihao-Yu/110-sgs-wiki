/**
 * SHU073 张苞·SP (Zhang Bao SP)
 *
 * 敢勇 (Ganyong / Bold Valor): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const ganyong: SkillPlugin = {
  id: 'ganyong',
  name: '敢勇',
  generalId: 'SHU073' as GeneralId,
  type: 'active',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu073Skills: SkillPlugin[] = [ganyong];
