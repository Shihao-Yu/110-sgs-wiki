/**
 * QUN032 张绣 (Zhang Xiu) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN032 = 'QUN032' as GeneralId;

export const qun032Placeholder: SkillPlugin = {
  id: 'qun_032_placeholder',
  name: 'QUN032技能',
  generalId: QUN032,
  type: 'passive',
  description: 'TODO: 待导入QUN032技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun032Skills: SkillPlugin[] = [qun032Placeholder];
