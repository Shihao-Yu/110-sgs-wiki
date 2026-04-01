/**
 * WEI041 程昱 (Cheng Yu) — 梦日云端
 *
 * Note: This is a different Cheng Yu from WEI023 (程昱 chengyu with different
 * skills in the national war edition).
 *
 * 搏击 (Boji): Placeholder for national war edition skills.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei041Placeholder: SkillPlugin = {
  id: 'skill_wei041_placeholder',
  name: '程昱技能',
  generalId: 'general_wei_044' as GeneralId,
  type: 'passive',
  description: '程昱（国战版）技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei041Skills: SkillPlugin[] = [wei041Placeholder];
