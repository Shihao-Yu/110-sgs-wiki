/**
 * SHU039 夏侯氏 (Lady Xiahou)
 *
 * 燕语 (Yanyu / Swallow Talk): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const yanyu: SkillPlugin = {
  id: 'yanyu',
  name: '燕语',
  generalId: 'SHU039' as GeneralId,
  type: 'active',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu039Skills: SkillPlugin[] = [yanyu];
