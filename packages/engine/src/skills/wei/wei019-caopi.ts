/**
 * WEI019 曹丕 (Cao Pi)
 *
 * Skills pending data import from extended general set.
 * TODO: Import skill definitions when extended WEI generals data is available.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei019Placeholder: SkillPlugin = {
  id: 'skill_wei019_placeholder',
  name: '曹丕技能',
  generalId: 'general_caopi' as GeneralId,
  type: 'passive',
  description: 'TODO: 待导入曹丕技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei019Skills: SkillPlugin[] = [wei019Placeholder];
