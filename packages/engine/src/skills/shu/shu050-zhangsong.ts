/**
 * SHU050 张松 (Zhang Song)
 *
 * 献图 (Xiantu / Present Map): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const xiantu: SkillPlugin = {
  id: 'xiantu',
  name: '献图',
  generalId: 'SHU050' as GeneralId,
  type: 'active',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu050Skills: SkillPlugin[] = [xiantu];
