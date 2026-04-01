/**
 * SHU020 老黄忠 (Huang Zhong — Veteran)
 *
 * 烈弓 extended variant (details pending).
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const liegong_v2: SkillPlugin = {
  id: 'liegong_v2',
  name: '烈弓',
  generalId: 'SHU020' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['playCard'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu020Skills: SkillPlugin[] = [liegong_v2];
