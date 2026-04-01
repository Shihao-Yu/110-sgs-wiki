/**
 * QUN030 李傕 (Li Jue) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN030 = 'QUN030' as GeneralId;

export const qun030Placeholder: SkillPlugin = {
  id: 'qun_030_placeholder',
  name: 'QUN030技能',
  generalId: QUN030,
  type: 'passive',
  description: 'TODO: 待导入QUN030技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun030Skills: SkillPlugin[] = [qun030Placeholder];
