/**
 * WEI064 乐綝 (Le Bin) — 刚烈武襄
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei064Placeholder: SkillPlugin = {
  id: 'skill_wei064_placeholder',
  name: '乐綝技能',
  generalId: 'general_wei_079' as GeneralId,
  type: 'passive',
  description: '乐綝技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei064Skills: SkillPlugin[] = [wei064Placeholder];
