/**
 * WEI084 曹羲 (Cao Xi) — 恭谨谦退
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei084Placeholder: SkillPlugin = {
  id: 'skill_wei084_placeholder',
  name: '曹羲技能',
  generalId: 'general_wei_099' as GeneralId,
  type: 'passive',
  description: '曹羲技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei084Skills: SkillPlugin[] = [wei084Placeholder];
