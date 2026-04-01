/**
 * WEI076 曹安民 (Cao Anmin) — 忠烈殉主
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei076Placeholder: SkillPlugin = {
  id: 'skill_wei076_placeholder',
  name: '曹安民技能',
  generalId: 'general_wei_091' as GeneralId,
  type: 'passive',
  description: '曹安民技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei076Skills: SkillPlugin[] = [wei076Placeholder];
