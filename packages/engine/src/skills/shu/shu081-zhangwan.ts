/**
 * SHU081 张嶷 (Zhang Wan)
 *
 * 抗敌 (Kangdi / Resist Enemy): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const kangdi: SkillPlugin = {
  id: 'kangdi',
  name: '抗敌',
  generalId: 'SHU081' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['damage'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu081Skills: SkillPlugin[] = [kangdi];
