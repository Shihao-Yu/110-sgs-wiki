/**
 * QUN039 陶谦 (Tao Qian) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN039 = 'QUN039' as GeneralId;

export const qun039Placeholder: SkillPlugin = {
  id: 'qun_039_placeholder',
  name: 'QUN039技能',
  generalId: QUN039,
  type: 'passive',
  description: 'TODO: 待导入QUN039技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun039Skills: SkillPlugin[] = [qun039Placeholder];
