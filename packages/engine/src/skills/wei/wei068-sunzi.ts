/**
 * WEI068 孙资 (Sun Zi) — 谋辅之才
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei068Placeholder: SkillPlugin = {
  id: 'skill_wei068_placeholder',
  name: '孙资技能',
  generalId: 'general_wei_083' as GeneralId,
  type: 'passive',
  description: '孙资技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei068Skills: SkillPlugin[] = [wei068Placeholder];
