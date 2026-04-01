/**
 * SHU035 张苞 (Zhang Bao, individual)
 *
 * 父魂 (Fuhun) variant — Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const fuhun_v2: SkillPlugin = {
  id: 'fuhun_v2',
  name: '父魂',
  generalId: 'SHU035' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu035Skills: SkillPlugin[] = [fuhun_v2];
