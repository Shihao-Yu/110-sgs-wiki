/**
 * WEI066 卞夫人 (Bian Furen) — 后宫之尊
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei066Placeholder: SkillPlugin = {
  id: 'skill_wei066_placeholder',
  name: '卞夫人技能',
  generalId: 'general_wei_081' as GeneralId,
  type: 'passive',
  description: '卞夫人技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei066Skills: SkillPlugin[] = [wei066Placeholder];
