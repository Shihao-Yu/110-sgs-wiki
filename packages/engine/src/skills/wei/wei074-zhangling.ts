/**
 * WEI074 张陵 (Zhang Ling) — 忠勇报国
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei074Placeholder: SkillPlugin = {
  id: 'skill_wei074_placeholder',
  name: '张陵技能',
  generalId: 'general_wei_089' as GeneralId,
  type: 'passive',
  description: '张陵技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei074Skills: SkillPlugin[] = [wei074Placeholder];
