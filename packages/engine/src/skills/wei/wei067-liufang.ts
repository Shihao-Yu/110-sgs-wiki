/**
 * WEI067 刘放 (Liu Fang) — 谋权弄策
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei067Placeholder: SkillPlugin = {
  id: 'skill_wei067_placeholder',
  name: '刘放技能',
  generalId: 'general_wei_082' as GeneralId,
  type: 'passive',
  description: '刘放技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei067Skills: SkillPlugin[] = [wei067Placeholder];
