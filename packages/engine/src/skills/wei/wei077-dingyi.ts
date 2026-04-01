/**
 * WEI077 丁仪 (Ding Yi) — 才高志广
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei077Placeholder: SkillPlugin = {
  id: 'skill_wei077_placeholder',
  name: '丁仪技能',
  generalId: 'general_wei_092' as GeneralId,
  type: 'passive',
  description: '丁仪技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei077Skills: SkillPlugin[] = [wei077Placeholder];
