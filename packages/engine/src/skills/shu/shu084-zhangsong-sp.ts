/**
 * SHU084 张松·SP (Zhang Song SP)
 *
 * 暗箭 (Anjian / Hidden Arrow): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const anjian: SkillPlugin = {
  id: 'anjian',
  name: '暗箭',
  generalId: 'SHU084' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['playCard'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu084Skills: SkillPlugin[] = [anjian];
