/**
 * WEI030 徐庶 (Xu Shu) — placeholder
 *
 * Skills pending data import from extended general set.
 * TODO: Import skill definitions when extended WEI generals data is available.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei030Placeholder: SkillPlugin = {
  id: 'skill_wei030_placeholder',
  name: '徐庶技能',
  generalId: 'general_xushu' as GeneralId,
  type: 'passive',
  description: 'TODO: 待导入徐庶技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei030Skills: SkillPlugin[] = [wei030Placeholder];
