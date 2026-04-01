/**
 * WEI078 丁廙 (Ding Yi) — 慷慨直谏
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei078Placeholder: SkillPlugin = {
  id: 'skill_wei078_placeholder',
  name: '丁廙技能',
  generalId: 'general_wei_093' as GeneralId,
  type: 'passive',
  description: '丁廙技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei078Skills: SkillPlugin[] = [wei078Placeholder];
