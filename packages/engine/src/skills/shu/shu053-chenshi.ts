/**
 * SHU053 陈式 (Chen Shi)
 *
 * 先辅 (Xianfu / Assist First): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const xianfu: SkillPlugin = {
  id: 'xianfu',
  name: '先辅',
  generalId: 'SHU053' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu053Skills: SkillPlugin[] = [xianfu];
