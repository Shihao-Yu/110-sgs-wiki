/**
 * WEI047 戏志才 (Xi Zhicai) — 举棋若定
 *
 * Placeholder — skills for national war edition to be imported.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei047Placeholder: SkillPlugin = {
  id: 'skill_wei047_placeholder',
  name: '戏志才技能',
  generalId: 'general_wei_055' as GeneralId,
  type: 'passive',
  description: '戏志才技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei047Skills: SkillPlugin[] = [wei047Placeholder];
