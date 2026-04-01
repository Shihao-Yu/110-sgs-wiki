/**
 * WEI029 贾诩 (Jia Xu) — placeholder
 *
 * Skills pending data import from extended general set.
 * TODO: Import skill definitions when extended WEI generals data is available.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei029Placeholder: SkillPlugin = {
  id: 'skill_wei029_placeholder',
  name: '贾诩技能',
  generalId: 'general_jiaxu' as GeneralId,
  type: 'passive',
  description: 'TODO: 待导入贾诩技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei029Skills: SkillPlugin[] = [wei029Placeholder];
