/**
 * SHU091 潘凤 (Pan Feng — SHU affiliation variant)
 *
 * 狂斧 (Kuangfu / Savage Axe): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const kuangfu091: SkillPlugin = {
  id: 'kuangfu_091',
  name: '狂斧',
  generalId: 'SHU091' as GeneralId,
  type: 'active',
  description: '待补充',
  triggers: ['playCard'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu091Skills: SkillPlugin[] = [kuangfu091];
