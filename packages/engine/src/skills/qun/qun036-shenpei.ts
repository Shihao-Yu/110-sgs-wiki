/**
 * QUN036 审配 (Shen Pei) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN036 = 'QUN036' as GeneralId;

export const qun036Placeholder: SkillPlugin = {
  id: 'qun_036_placeholder',
  name: 'QUN036技能',
  generalId: QUN036,
  type: 'passive',
  description: 'TODO: 待导入QUN036技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun036Skills: SkillPlugin[] = [qun036Placeholder];
