/**
 * WEI061 司马昭 (Sima Zhao) — 晋王之心
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei061Placeholder: SkillPlugin = {
  id: 'skill_wei061_placeholder',
  name: '司马昭技能',
  generalId: 'general_wei_076' as GeneralId,
  type: 'passive',
  description: '司马昭技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei061Skills: SkillPlugin[] = [wei061Placeholder];
