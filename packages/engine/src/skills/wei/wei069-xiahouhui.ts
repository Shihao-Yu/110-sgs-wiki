/**
 * WEI069 夏侯徽 (Xiahou Hui) — 秀外慧中
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei069Placeholder: SkillPlugin = {
  id: 'skill_wei069_placeholder',
  name: '夏侯徽技能',
  generalId: 'general_wei_084' as GeneralId,
  type: 'passive',
  description: '夏侯徽技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei069Skills: SkillPlugin[] = [wei069Placeholder];
