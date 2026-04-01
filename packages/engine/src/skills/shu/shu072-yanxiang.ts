/**
 * SHU072 严颜 (Yan Yan — SP variant)
 *
 * 傲骨 (Aogu / Proud Bone): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const aogu: SkillPlugin = {
  id: 'aogu',
  name: '傲骨',
  generalId: 'SHU072' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['damage'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu072Skills: SkillPlugin[] = [aogu];
