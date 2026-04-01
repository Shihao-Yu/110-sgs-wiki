/**
 * WEI050 刘晔 (Liu Ye) — 焚焰天征
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei050Placeholder: SkillPlugin = {
  id: 'skill_wei050_placeholder',
  name: '刘晔技能',
  generalId: 'general_wei_062' as GeneralId,
  type: 'passive',
  description: '刘晔技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei050Skills: SkillPlugin[] = [wei050Placeholder];
