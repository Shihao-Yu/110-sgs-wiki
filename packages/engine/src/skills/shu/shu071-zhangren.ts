/**
 * SHU071 张任 (Zhang Ren)
 *
 * 纵火 (Zonghuo / Arson): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const zonghuo: SkillPlugin = {
  id: 'zonghuo',
  name: '纵火',
  generalId: 'SHU071' as GeneralId,
  type: 'active',
  description: '待补充',
  triggers: ['playCard'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu071Skills: SkillPlugin[] = [zonghuo];
