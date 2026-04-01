/**
 * SHU083 秦宓 (Qin Mi)
 *
 * 天辩 (Tianbian / Heavenly Debate): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const tianbian: SkillPlugin = {
  id: 'tianbian',
  name: '天辩',
  generalId: 'SHU083' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['playCard'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu083Skills: SkillPlugin[] = [tianbian];
