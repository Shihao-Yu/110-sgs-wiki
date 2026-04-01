/**
 * SHU090 刘表 (Liu Biao — SHU affiliation variant)
 *
 * 自守 (Zishou / Self Preservation): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const zishou: SkillPlugin = {
  id: 'zishou',
  name: '自守',
  generalId: 'SHU090' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu090Skills: SkillPlugin[] = [zishou];
