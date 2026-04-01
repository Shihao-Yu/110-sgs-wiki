/**
 * WEI071 张既 (Zhang Ji) — 平乱安境
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei071Placeholder: SkillPlugin = {
  id: 'skill_wei071_placeholder',
  name: '张既技能',
  generalId: 'general_wei_086' as GeneralId,
  type: 'passive',
  description: '张既技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei071Skills: SkillPlugin[] = [wei071Placeholder];
