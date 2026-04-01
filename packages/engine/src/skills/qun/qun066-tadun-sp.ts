/**
 * QUN066 蹋顿(SP) (Ta Dun SP) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN066 = 'QUN066' as GeneralId;

export const qun066Placeholder: SkillPlugin = {
  id: 'qun_066_placeholder',
  name: 'QUN066技能',
  generalId: QUN066,
  type: 'passive',
  description: 'TODO: 待导入QUN066技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun066Skills: SkillPlugin[] = [qun066Placeholder];
