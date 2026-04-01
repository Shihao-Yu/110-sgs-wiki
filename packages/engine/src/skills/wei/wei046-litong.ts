/**
 * WEI046 李通 (Li Tong) — 破寨攻贼
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei046Placeholder: SkillPlugin = {
  id: 'skill_wei046_placeholder',
  name: '李通技能',
  generalId: 'general_wei_054' as GeneralId,
  type: 'passive',
  description: '李通技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei046Skills: SkillPlugin[] = [wei046Placeholder];
