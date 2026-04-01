/**
 * WEI081 臧霸 (Zang Ba) — 威震青徐
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei081Placeholder: SkillPlugin = {
  id: 'skill_wei081_placeholder',
  name: '臧霸技能',
  generalId: 'general_wei_096' as GeneralId,
  type: 'passive',
  description: '臧霸技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei081Skills: SkillPlugin[] = [wei081Placeholder];
