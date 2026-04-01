/**
 * WEI045 王基 (Wang Ji) — 清奢明水
 *
 * 巧佞 (Qiaoning): Placeholder — skills for national war edition
 * to be imported from extended data.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const wei045Placeholder: SkillPlugin = {
  id: 'skill_wei045_placeholder',
  name: '王基技能',
  generalId: 'general_wei_053' as GeneralId,
  type: 'passive',
  description: '王基技能待导入。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const wei045Skills: SkillPlugin[] = [wei045Placeholder];
