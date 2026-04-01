/**
 * WEI088 王凌 (Wang Ling) — 忠骨谋逆
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei088Placeholder: SkillPlugin = {
  id: 'skill_wei088_placeholder',
  name: '王凌技能',
  generalId: 'general_wei_103' as GeneralId,
  type: 'passive',
  description: '王凌技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei088Skills: SkillPlugin[] = [wei088Placeholder];
