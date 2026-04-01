/**
 * WEI024 曹洪 (Cao Hong) — placeholder
 *
 * Skills pending data import from extended general set.
 * TODO: Import skill definitions when extended WEI generals data is available.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei024Placeholder: SkillPlugin = {
  id: 'skill_wei024_placeholder',
  name: '曹洪技能',
  generalId: 'general_caohong' as GeneralId,
  type: 'passive',
  description: 'TODO: 待导入曹洪技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei024Skills: SkillPlugin[] = [wei024Placeholder];
