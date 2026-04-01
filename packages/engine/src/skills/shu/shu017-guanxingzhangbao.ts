/**
 * SHU017 关兴&张苞 (Guan Xing & Zhang Bao)
 *
 * 父魂 (Fuhun / Ancestral Spirit): During draw phase, you may forgo drawing
 * to instead draw cards equal to the number of players killed this turn.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const fuhun: SkillPlugin = {
  id: 'fuhun',
  name: '父魂',
  generalId: 'SHU017' as GeneralId,
  type: 'active',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu017Skills: SkillPlugin[] = [fuhun];
