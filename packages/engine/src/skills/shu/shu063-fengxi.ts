/**
 * SHU063 冯习 (Feng Xi)
 *
 * 突袭 (Tuxi / Surprise Raid): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const tuxi063: SkillPlugin = {
  id: 'tuxi_063',
  name: '突袭',
  generalId: 'SHU063' as GeneralId,
  type: 'active',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu063Skills: SkillPlugin[] = [tuxi063];
