/**
 * SHU013 马谡 (Ma Su)
 *
 * 心战 (Xinzhan / Psychological Warfare): Play phase skill (details pending).
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const xinzhan: SkillPlugin = {
  id: 'xinzhan',
  name: '心战',
  generalId: 'SHU013' as GeneralId,
  type: 'active',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu013Skills: SkillPlugin[] = [xinzhan];
