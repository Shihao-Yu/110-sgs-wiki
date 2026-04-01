/**
 * SHU014 吴国太 (Wu Guotai)
 *
 * 甘露 (Ganlu / Sweet Dew): Exchange equipment between two players.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const ganlu: SkillPlugin = {
  id: 'ganlu',
  name: '甘露',
  generalId: 'SHU014' as GeneralId,
  type: 'active',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu014Skills: SkillPlugin[] = [ganlu];
