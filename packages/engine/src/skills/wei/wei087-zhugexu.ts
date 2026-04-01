/**
 * WEI087 诸葛绪 (Zhuge Xu) — 持重守成
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei087Placeholder: SkillPlugin = {
  id: 'skill_wei087_placeholder',
  name: '诸葛绪技能',
  generalId: 'general_wei_102' as GeneralId,
  type: 'passive',
  description: '诸葛绪技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei087Skills: SkillPlugin[] = [wei087Placeholder];
