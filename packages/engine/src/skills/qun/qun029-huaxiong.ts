/**
 * QUN029 华雄 (Hua Xiong) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN029 = 'QUN029' as GeneralId;

export const qun029Placeholder: SkillPlugin = {
  id: 'qun_029_placeholder',
  name: 'QUN029技能',
  generalId: QUN029,
  type: 'passive',
  description: 'TODO: 待导入QUN029技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun029Skills: SkillPlugin[] = [qun029Placeholder];
