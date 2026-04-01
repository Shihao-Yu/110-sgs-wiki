/**
 * WEI054 郝昭 (Hao Zhao) — 智密善守
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei054Placeholder: SkillPlugin = {
  id: 'skill_wei054_placeholder',
  name: '郝昭技能',
  generalId: 'general_wei_067' as GeneralId,
  type: 'passive',
  description: '郝昭技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei054Skills: SkillPlugin[] = [wei054Placeholder];
