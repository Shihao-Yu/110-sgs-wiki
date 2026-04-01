/**
 * SHU033 董允 (Dong Yun)
 *
 * 秉正 (Bingzheng / Integrity): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const bingzheng: SkillPlugin = {
  id: 'bingzheng',
  name: '秉正',
  generalId: 'SHU033' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu033Skills: SkillPlugin[] = [bingzheng];
