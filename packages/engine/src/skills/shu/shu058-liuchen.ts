/**
 * SHU058 刘谌 (Liu Chen)
 *
 * 殉志 (Xunzhi / Martyr's Will): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const xunzhi: SkillPlugin = {
  id: 'xunzhi',
  name: '殉志',
  generalId: 'SHU058' as GeneralId,
  type: 'active',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu058Skills: SkillPlugin[] = [xunzhi];
