/**
 * WEI073 曹爽 (Cao Shuang) — 骄横辅政
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei073Placeholder: SkillPlugin = {
  id: 'skill_wei073_placeholder',
  name: '曹爽技能',
  generalId: 'general_wei_088' as GeneralId,
  type: 'passive',
  description: '曹爽技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei073Skills: SkillPlugin[] = [wei073Placeholder];
