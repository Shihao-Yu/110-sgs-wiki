/**
 * WEI063 张虎 (Zhang Hu) — 虎啸河山
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei063Placeholder: SkillPlugin = {
  id: 'skill_wei063_placeholder',
  name: '张虎技能',
  generalId: 'general_wei_078' as GeneralId,
  type: 'passive',
  description: '张虎技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei063Skills: SkillPlugin[] = [wei063Placeholder];
