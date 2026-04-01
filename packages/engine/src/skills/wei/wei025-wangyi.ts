/**
 * WEI025 王异 (Wang Yi) — placeholder
 *
 * Skills pending data import from extended general set.
 * TODO: Import skill definitions when extended WEI generals data is available.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei025Placeholder: SkillPlugin = {
  id: 'skill_wei025_placeholder',
  name: '王异技能',
  generalId: 'general_wangyi' as GeneralId,
  type: 'passive',
  description: 'TODO: 待导入王异技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei025Skills: SkillPlugin[] = [wei025Placeholder];
