/**
 * WEI021 李典 (Li Dian)
 *
 * Skills pending data import from extended general set.
 * TODO: Import skill definitions when extended WEI generals data is available.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei021Placeholder: SkillPlugin = {
  id: 'skill_wei021_placeholder',
  name: '李典技能',
  generalId: 'general_lidian' as GeneralId,
  type: 'passive',
  description: 'TODO: 待导入李典技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei021Skills: SkillPlugin[] = [wei021Placeholder];
