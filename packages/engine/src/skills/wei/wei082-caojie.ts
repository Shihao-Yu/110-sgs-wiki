/**
 * WEI082 曹节 (Cao Jie) — 献穆皇后
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei082Placeholder: SkillPlugin = {
  id: 'skill_wei082_placeholder',
  name: '曹节技能',
  generalId: 'general_wei_097' as GeneralId,
  type: 'passive',
  description: '曹节技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei082Skills: SkillPlugin[] = [wei082Placeholder];
