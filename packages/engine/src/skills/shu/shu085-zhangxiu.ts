/**
 * SHU085 张绣 (Zhang Xiu — SHU affiliation variant)
 *
 * 傅业 (Fuye / Inherited Craft): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const fuye: SkillPlugin = {
  id: 'fuye',
  name: '傅业',
  generalId: 'SHU085' as GeneralId,
  type: 'active',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu085Skills: SkillPlugin[] = [fuye];
