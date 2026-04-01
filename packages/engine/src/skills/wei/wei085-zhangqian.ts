/**
 * WEI085 张虔 (Zhang Qian) — 义从北疆
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei085Placeholder: SkillPlugin = {
  id: 'skill_wei085_placeholder',
  name: '张虔技能',
  generalId: 'general_wei_100' as GeneralId,
  type: 'passive',
  description: '张虔技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei085Skills: SkillPlugin[] = [wei085Placeholder];
