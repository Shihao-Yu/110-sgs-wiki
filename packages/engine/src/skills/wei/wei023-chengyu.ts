/**
 * WEI023 程昱 (Cheng Yu) — placeholder
 *
 * Skills pending data import from extended general set.
 * TODO: Import skill definitions when extended WEI generals data is available.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei023Placeholder: SkillPlugin = {
  id: 'skill_wei023_placeholder',
  name: '程昱技能',
  generalId: 'general_chengyu' as GeneralId,
  type: 'passive',
  description: 'TODO: 待导入程昱技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei023Skills: SkillPlugin[] = [wei023Placeholder];
