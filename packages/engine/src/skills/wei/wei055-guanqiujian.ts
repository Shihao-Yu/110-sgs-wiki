/**
 * WEI055 毌丘俭 (Guanqiu Jian) — 攻敌挫士
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei055Placeholder: SkillPlugin = {
  id: 'skill_wei055_placeholder',
  name: '毌丘俭技能',
  generalId: 'general_wei_068' as GeneralId,
  type: 'passive',
  description: '毌丘俭技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei055Skills: SkillPlugin[] = [wei055Placeholder];
