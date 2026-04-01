/**
 * SHU059 赵统&赵广 (Zhao Tong & Zhao Guang)
 *
 * 协力 (Xieli / Collaborate): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const xieli: SkillPlugin = {
  id: 'xieli',
  name: '协力',
  generalId: 'SHU059' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['playCard'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu059Skills: SkillPlugin[] = [xieli];
