/**
 * WEI026 郭淮 (Guo Huai) — placeholder
 *
 * Skills pending data import from extended general set.
 * TODO: Import skill definitions when extended WEI generals data is available.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei026Placeholder: SkillPlugin = {
  id: 'skill_wei026_placeholder',
  name: '郭淮技能',
  generalId: 'general_guohuai' as GeneralId,
  type: 'passive',
  description: 'TODO: 待导入郭淮技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei026Skills: SkillPlugin[] = [wei026Placeholder];
