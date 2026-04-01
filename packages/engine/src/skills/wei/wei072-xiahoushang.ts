/**
 * WEI072 夏侯尚 (Xiahou Shang) — 征南勇略
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei072Placeholder: SkillPlugin = {
  id: 'skill_wei072_placeholder',
  name: '夏侯尚技能',
  generalId: 'general_wei_087' as GeneralId,
  type: 'passive',
  description: '夏侯尚技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei072Skills: SkillPlugin[] = [wei072Placeholder];
