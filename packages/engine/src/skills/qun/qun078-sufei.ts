/**
 * QUN078 苏飞 (Su Fei) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN078 = 'QUN078' as GeneralId;

export const qun078Placeholder: SkillPlugin = {
  id: 'qun_078_placeholder',
  name: 'QUN078技能',
  generalId: QUN078,
  type: 'passive',
  description: 'TODO: 待导入QUN078技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun078Skills: SkillPlugin[] = [qun078Placeholder];
