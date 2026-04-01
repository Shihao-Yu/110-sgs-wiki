/**
 * WEI080 刘协 (Liu Xie) — 天子末路
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei080Placeholder: SkillPlugin = {
  id: 'skill_wei080_placeholder',
  name: '刘协技能',
  generalId: 'general_wei_095' as GeneralId,
  type: 'passive',
  description: '刘协技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei080Skills: SkillPlugin[] = [wei080Placeholder];
