/**
 * SHU086 鲁班 (Lu Ban — SHU craftsman)
 *
 * 连弩 (Liannu / Repeating Crossbow): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const liannu: SkillPlugin = {
  id: 'liannu',
  name: '连弩',
  generalId: 'SHU086' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['playCard'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu086Skills: SkillPlugin[] = [liannu];
