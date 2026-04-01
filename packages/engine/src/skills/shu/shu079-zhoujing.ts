/**
 * SHU079 周静 (Zhou Jing)
 *
 * 匡扶 (Kuangfu / Restoration): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const kuangfu: SkillPlugin = {
  id: 'kuangfu',
  name: '匡扶',
  generalId: 'SHU079' as GeneralId,
  type: 'active',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu079Skills: SkillPlugin[] = [kuangfu];
