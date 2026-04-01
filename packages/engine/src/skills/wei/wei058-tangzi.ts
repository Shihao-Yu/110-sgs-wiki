/**
 * WEI058 唐咨 (Tang Zi) — 绘船制图
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei058Placeholder: SkillPlugin = {
  id: 'skill_wei058_placeholder',
  name: '唐咨技能',
  generalId: 'general_wei_072' as GeneralId,
  type: 'passive',
  description: '唐咨技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei058Skills: SkillPlugin[] = [wei058Placeholder];
