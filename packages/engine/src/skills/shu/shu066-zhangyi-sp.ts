/**
 * SHU066 张翼·SP (Zhang Yi SP)
 *
 * 殿后 (Dianhou / Rear Guard): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const dianhou: SkillPlugin = {
  id: 'dianhou',
  name: '殿后',
  generalId: 'SHU066' as GeneralId,
  type: 'active',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu066Skills: SkillPlugin[] = [dianhou];
