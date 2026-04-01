/**
 * SHU056 周夫人 (Lady Zhou)
 *
 * 芬芳 (Fenfang / Fragrance): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const fenfang: SkillPlugin = {
  id: 'fenfang',
  name: '芬芳',
  generalId: 'SHU056' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu056Skills: SkillPlugin[] = [fenfang];
