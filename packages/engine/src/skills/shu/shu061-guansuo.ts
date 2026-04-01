/**
 * SHU061 关索 (Guan Suo)
 *
 * 武继 (Wuji / Martial Succession): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wuji: SkillPlugin = {
  id: 'wuji',
  name: '武继',
  generalId: 'SHU061' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu061Skills: SkillPlugin[] = [wuji];
