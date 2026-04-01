/**
 * WEI053 嵇康 (Ji Kang) — 龙生九子
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei053Placeholder: SkillPlugin = {
  id: 'skill_wei053_placeholder',
  name: '嵇康技能',
  generalId: 'general_wei_065' as GeneralId,
  type: 'passive',
  description: '嵇康技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei053Skills: SkillPlugin[] = [wei053Placeholder];
