/**
 * WEI051 马钧 (Ma Jun) — 能工巧匠
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei051Placeholder: SkillPlugin = {
  id: 'skill_wei051_placeholder',
  name: '马钧技能',
  generalId: 'general_wei_063' as GeneralId,
  type: 'passive',
  description: '马钧技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei051Skills: SkillPlugin[] = [wei051Placeholder];
