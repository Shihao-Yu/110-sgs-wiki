/**
 * WEI070 杜畿 (Du Ji) — 教化安民
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei070Placeholder: SkillPlugin = {
  id: 'skill_wei070_placeholder',
  name: '杜畿技能',
  generalId: 'general_wei_085' as GeneralId,
  type: 'passive',
  description: '杜畿技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei070Skills: SkillPlugin[] = [wei070Placeholder];
