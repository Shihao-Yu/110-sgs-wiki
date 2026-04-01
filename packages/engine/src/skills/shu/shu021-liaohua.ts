/**
 * SHU021 廖化 (Liao Hua)
 *
 * 当先 (Dangxian / Take the Lead): At the start of your turn, you may
 * enter an extra play phase before the prepare phase.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const dangxian: SkillPlugin = {
  id: 'dangxian',
  name: '当先',
  generalId: 'SHU021' as GeneralId,
  type: 'lock',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu021Skills: SkillPlugin[] = [dangxian];
