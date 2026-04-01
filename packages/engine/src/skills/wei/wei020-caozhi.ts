/**
 * WEI020 曹植 (Cao Zhi)
 *
 * Skills pending data import from extended general set.
 * TODO: Import skill definitions when extended WEI generals data is available.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei020Placeholder: SkillPlugin = {
  id: 'skill_wei020_placeholder',
  name: '曹植技能',
  generalId: 'general_caozhi' as GeneralId,
  type: 'passive',
  description: 'TODO: 待导入曹植技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei020Skills: SkillPlugin[] = [wei020Placeholder];
