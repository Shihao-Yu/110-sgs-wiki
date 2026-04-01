/**
 * SHU028 徐庶之母 (Xu Shu's Mother / Lady Xu)
 *
 * Placeholder — skills pending specification.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const shu028_placeholder: SkillPlugin = {
  id: 'shu028_placeholder',
  name: '待定',
  generalId: 'SHU028' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu028Skills: SkillPlugin[] = [shu028_placeholder];
