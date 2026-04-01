/**
 * SHU075 吴班 (Wu Ban)
 *
 * 果断 (Guoduan / Resolute): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const guoduan: SkillPlugin = {
  id: 'guoduan',
  name: '果断',
  generalId: 'SHU075' as GeneralId,
  type: 'active',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu075Skills: SkillPlugin[] = [guoduan];
