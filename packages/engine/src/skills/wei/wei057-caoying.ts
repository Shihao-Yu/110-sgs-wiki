/**
 * WEI057 曹婴 (Cao Ying) — 魏武遗风
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei057Placeholder: SkillPlugin = {
  id: 'skill_wei057_placeholder',
  name: '曹婴技能',
  generalId: 'general_wei_070' as GeneralId,
  type: 'passive',
  description: '曹婴技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei057Skills: SkillPlugin[] = [wei057Placeholder];
