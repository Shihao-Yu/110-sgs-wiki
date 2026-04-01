/**
 * SHU048 花鬘 (Hua Man)
 *
 * 蛮裔 (Manyi / Nanman Heritage): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const manyi: SkillPlugin = {
  id: 'manyi',
  name: '蛮裔',
  generalId: 'SHU048' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['playCard'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu048Skills: SkillPlugin[] = [manyi];
