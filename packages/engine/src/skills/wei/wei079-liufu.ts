/**
 * WEI079 刘馥 (Liu Fu) — 牧守淮南
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei079Placeholder: SkillPlugin = {
  id: 'skill_wei079_placeholder',
  name: '刘馥技能',
  generalId: 'general_wei_094' as GeneralId,
  type: 'passive',
  description: '刘馥技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei079Skills: SkillPlugin[] = [wei079Placeholder];
