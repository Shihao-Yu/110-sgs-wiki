/**
 * SHU076 关樾 (Guan Yue)
 *
 * 义嗣 (Yisi / Righteous Successor): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const yisi: SkillPlugin = {
  id: 'yisi',
  name: '义嗣',
  generalId: 'SHU076' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu076Skills: SkillPlugin[] = [yisi];
