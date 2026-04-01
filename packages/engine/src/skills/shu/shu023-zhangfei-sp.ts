/**
 * SHU023 张飞·SP (Zhang Fei — SP)
 *
 * 咆哮 (Paoxiao) SP variant.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const paoxiao_sp: SkillPlugin = {
  id: 'paoxiao_sp',
  name: '咆哮',
  generalId: 'SHU023' as GeneralId,
  type: 'lock',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu023Skills: SkillPlugin[] = [paoxiao_sp];
