/**
 * WEI075 文聘 (Wen Pin) — 镇北将军
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei075Placeholder: SkillPlugin = {
  id: 'skill_wei075_placeholder',
  name: '文聘技能',
  generalId: 'general_wei_090' as GeneralId,
  type: 'passive',
  description: '文聘技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei075Skills: SkillPlugin[] = [wei075Placeholder];
