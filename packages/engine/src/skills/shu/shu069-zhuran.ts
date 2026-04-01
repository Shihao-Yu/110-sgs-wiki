/**
 * SHU069 朱然 (Zhu Ran — SHU affiliation variant)
 *
 * 胆守 (Danshou / Courageous Guard): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const danshou: SkillPlugin = {
  id: 'danshou',
  name: '胆守',
  generalId: 'SHU069' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['damage'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu069Skills: SkillPlugin[] = [danshou];
