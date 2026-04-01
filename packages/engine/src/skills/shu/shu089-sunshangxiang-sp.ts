/**
 * SHU089 孙尚香·SP (Sun Shang Xiang SP)
 *
 * 良助 (Liangzhu / Good Assistance): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const liangzhu: SkillPlugin = {
  id: 'liangzhu',
  name: '良助',
  generalId: 'SHU089' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['drawCards'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu089Skills: SkillPlugin[] = [liangzhu];
