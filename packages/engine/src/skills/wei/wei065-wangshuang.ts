/**
 * WEI065 王双 (Wang Shuang) — 猛锐先登
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei065Placeholder: SkillPlugin = {
  id: 'skill_wei065_placeholder',
  name: '王双技能',
  generalId: 'general_wei_080' as GeneralId,
  type: 'passive',
  description: '王双技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei065Skills: SkillPlugin[] = [wei065Placeholder];
