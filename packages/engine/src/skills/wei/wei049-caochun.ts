/**
 * WEI049 曹纯 (Cao Chun) — 虎啸龙渊
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei049Placeholder: SkillPlugin = {
  id: 'skill_wei049_placeholder',
  name: '曹纯技能',
  generalId: 'general_wei_061' as GeneralId,
  type: 'passive',
  description: '曹纯技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei049Skills: SkillPlugin[] = [wei049Placeholder];
