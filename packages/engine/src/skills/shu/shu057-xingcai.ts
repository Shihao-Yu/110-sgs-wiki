/**
 * SHU057 星彩 (Xing Cai)
 *
 * 鸾翔 (Luanxiang / Phoenix Flight): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const luanxiang: SkillPlugin = {
  id: 'luanxiang',
  name: '鸾翔',
  generalId: 'SHU057' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu057Skills: SkillPlugin[] = [luanxiang];
