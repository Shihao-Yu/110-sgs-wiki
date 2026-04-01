/**
 * SHU077 高翔 (Gao Xiang)
 *
 * 拒围 (Juwei / Resist Siege): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const juwei: SkillPlugin = {
  id: 'juwei',
  name: '拒围',
  generalId: 'SHU077' as GeneralId,
  type: 'active',
  description: '待补充',
  triggers: ['playCard'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu077Skills: SkillPlugin[] = [juwei];
