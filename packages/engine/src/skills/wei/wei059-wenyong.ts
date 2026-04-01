/**
 * WEI059 文鸯 (Wen Yang) — 骁勇金衔
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei059Placeholder: SkillPlugin = {
  id: 'skill_wei059_placeholder',
  name: '文鸯技能',
  generalId: 'general_wei_074' as GeneralId,
  type: 'passive',
  description: '文鸯技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei059Skills: SkillPlugin[] = [wei059Placeholder];
