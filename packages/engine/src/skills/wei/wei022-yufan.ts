/**
 * WEI022 于翻 (Yu Fan) — placeholder
 *
 * Skills pending data import from extended general set.
 * TODO: Import skill definitions when extended WEI generals data is available.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei022Placeholder: SkillPlugin = {
  id: 'skill_wei022_placeholder',
  name: 'WEI022技能',
  generalId: 'general_wei022' as GeneralId,
  type: 'passive',
  description: 'TODO: 待导入技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei022Skills: SkillPlugin[] = [wei022Placeholder];
