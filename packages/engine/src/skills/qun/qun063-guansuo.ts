/**
 * QUN063 关索 (Guan Suo) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN063 = 'QUN063' as GeneralId;

export const qun063Placeholder: SkillPlugin = {
  id: 'qun_063_placeholder',
  name: 'QUN063技能',
  generalId: QUN063,
  type: 'passive',
  description: 'TODO: 待导入QUN063技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun063Skills: SkillPlugin[] = [qun063Placeholder];
