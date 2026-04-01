/**
 * SHU049 严颜 (Yan Yan)
 *
 * 挺身 (Tingshen / Stand Firm): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const tingshen: SkillPlugin = {
  id: 'tingshen',
  name: '挺身',
  generalId: 'SHU049' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['damage'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu049Skills: SkillPlugin[] = [tingshen];
