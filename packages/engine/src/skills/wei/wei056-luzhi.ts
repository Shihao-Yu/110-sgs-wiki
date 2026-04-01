/**
 * WEI056 鲁芝 (Lu Zhi) — 夷夏慕德
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei056Placeholder: SkillPlugin = {
  id: 'skill_wei056_placeholder',
  name: '鲁芝技能',
  generalId: 'general_wei_069' as GeneralId,
  type: 'passive',
  description: '鲁芝技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei056Skills: SkillPlugin[] = [wei056Placeholder];
