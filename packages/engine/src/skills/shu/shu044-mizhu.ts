/**
 * SHU044 糜竺 (Mi Zhu)
 *
 * 资助 (Zizhu / Patronize): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const zizhu: SkillPlugin = {
  id: 'zizhu',
  name: '资助',
  generalId: 'SHU044' as GeneralId,
  type: 'active',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu044Skills: SkillPlugin[] = [zizhu];
