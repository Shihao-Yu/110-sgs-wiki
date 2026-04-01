/**
 * QUN067 张曼成 (Zhang Mancheng) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN067 = 'QUN067' as GeneralId;

export const qun067Placeholder: SkillPlugin = {
  id: 'qun_067_placeholder',
  name: 'QUN067技能',
  generalId: QUN067,
  type: 'passive',
  description: 'TODO: 待导入QUN067技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun067Skills: SkillPlugin[] = [qun067Placeholder];
