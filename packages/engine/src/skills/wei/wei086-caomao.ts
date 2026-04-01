/**
 * WEI086 曹髦 (Cao Mao) — 壮志未酬
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei086Placeholder: SkillPlugin = {
  id: 'skill_wei086_placeholder',
  name: '曹髦技能',
  generalId: 'general_wei_101' as GeneralId,
  type: 'passive',
  description: '曹髦技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei086Skills: SkillPlugin[] = [wei086Placeholder];
