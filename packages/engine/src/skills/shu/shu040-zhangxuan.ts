/**
 * SHU040 张嶷 (Zhang Ni / Zhang Xuan)
 *
 * 慷忾 (Kangkai / Generosity): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const kangkai: SkillPlugin = {
  id: 'kangkai',
  name: '慷忾',
  generalId: 'SHU040' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['playCard'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu040Skills: SkillPlugin[] = [kangkai];
