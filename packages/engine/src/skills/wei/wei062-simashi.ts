/**
 * WEI062 司马师 (Sima Shi) — 铁腕摄政
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei062Placeholder: SkillPlugin = {
  id: 'skill_wei062_placeholder',
  name: '司马师技能',
  generalId: 'general_wei_077' as GeneralId,
  type: 'passive',
  description: '司马师技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei062Skills: SkillPlugin[] = [wei062Placeholder];
