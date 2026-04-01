/**
 * WEI028 邓艾 (Deng Ai) — placeholder
 *
 * Skills pending data import from extended general set.
 * TODO: Import skill definitions when extended WEI generals data is available.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei028Placeholder: SkillPlugin = {
  id: 'skill_wei028_placeholder',
  name: '邓艾技能',
  generalId: 'general_dengai' as GeneralId,
  type: 'passive',
  description: 'TODO: 待导入邓艾技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei028Skills: SkillPlugin[] = [wei028Placeholder];
