/**
 * QUN050 司马昭 (Sima Zhao) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN050 = 'QUN050' as GeneralId;

export const qun050Placeholder: SkillPlugin = {
  id: 'qun_050_placeholder',
  name: 'QUN050技能',
  generalId: QUN050,
  type: 'passive',
  description: 'TODO: 待导入QUN050技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun050Skills: SkillPlugin[] = [qun050Placeholder];
