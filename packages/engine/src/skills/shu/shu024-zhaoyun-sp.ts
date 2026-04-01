/**
 * SHU024 赵云·SP (Zhao Yun — SP)
 *
 * 龙胆 (Longdan) SP variant.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const longdan_sp: SkillPlugin = {
  id: 'longdan_sp',
  name: '龙胆',
  generalId: 'SHU024' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['playCard', 'response'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu024Skills: SkillPlugin[] = [longdan_sp];
