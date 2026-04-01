/**
 * WEI083 蒯良蒯越 (Kuai Liang & Kuai Yue) — 谋辅双杰
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei083Placeholder: SkillPlugin = {
  id: 'skill_wei083_placeholder',
  name: '蒯良蒯越技能',
  generalId: 'general_wei_098' as GeneralId,
  type: 'passive',
  description: '蒯良蒯越技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei083Skills: SkillPlugin[] = [wei083Placeholder];
