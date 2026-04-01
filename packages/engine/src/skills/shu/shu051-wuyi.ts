/**
 * SHU051 吴懿 (Wu Yi)
 *
 * 奋威 (Fenwei / Rally): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const fenwei: SkillPlugin = {
  id: 'fenwei',
  name: '奋威',
  generalId: 'SHU051' as GeneralId,
  type: 'active',
  description: '待补充',
  triggers: ['playCard'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu051Skills: SkillPlugin[] = [fenwei];
