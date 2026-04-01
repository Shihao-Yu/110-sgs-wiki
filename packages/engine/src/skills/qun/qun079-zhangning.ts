/**
 * QUN079 张宁 (Zhang Ning) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN079 = 'QUN079' as GeneralId;

export const qun079Placeholder: SkillPlugin = {
  id: 'qun_079_placeholder',
  name: 'QUN079技能',
  generalId: QUN079,
  type: 'passive',
  description: 'TODO: 待导入QUN079技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun079Skills: SkillPlugin[] = [qun079Placeholder];
