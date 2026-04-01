/**
 * WEI027 钟会 (Zhong Hui) — placeholder
 *
 * Skills pending data import from extended general set.
 * TODO: Import skill definitions when extended WEI generals data is available.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei027Placeholder: SkillPlugin = {
  id: 'skill_wei027_placeholder',
  name: '钟会技能',
  generalId: 'general_zhonghui' as GeneralId,
  type: 'passive',
  description: 'TODO: 待导入钟会技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei027Skills: SkillPlugin[] = [wei027Placeholder];
