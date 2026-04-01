/**
 * SHU088 吴国太·SP (Wu Guo Tai SP)
 *
 * 补益 (Buyi / Supplement): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const buyi: SkillPlugin = {
  id: 'buyi',
  name: '补益',
  generalId: 'SHU088' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['loseHp'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu088Skills: SkillPlugin[] = [buyi];
