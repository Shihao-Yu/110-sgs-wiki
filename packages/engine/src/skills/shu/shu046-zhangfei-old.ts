/**
 * SHU046 老张飞 (Zhang Fei — Veteran)
 *
 * 咆哮 (Paoxiao) veteran variant. Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const paoxiao_old: SkillPlugin = {
  id: 'paoxiao_old',
  name: '咆哮',
  generalId: 'SHU046' as GeneralId,
  type: 'lock',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu046Skills: SkillPlugin[] = [paoxiao_old];
