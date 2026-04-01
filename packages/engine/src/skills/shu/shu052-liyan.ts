/**
 * SHU052 李严 (Li Yan)
 *
 * 鞠躬 (Jugong / Devotion): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const jugong: SkillPlugin = {
  id: 'jugong',
  name: '鞠躬',
  generalId: 'SHU052' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu052Skills: SkillPlugin[] = [jugong];
