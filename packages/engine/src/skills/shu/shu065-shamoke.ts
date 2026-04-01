/**
 * SHU065 沙摩柯 (Sha Mo Ke)
 *
 * 蒺藜 (Jili / Thistle): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const jili: SkillPlugin = {
  id: 'jili',
  name: '蒺藜',
  generalId: 'SHU065' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['playCard'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu065Skills: SkillPlugin[] = [jili];
