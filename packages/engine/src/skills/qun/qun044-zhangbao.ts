/**
 * QUN044 张宝 (Zhang Bao) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN044 = 'QUN044' as GeneralId;

export const qun044Placeholder: SkillPlugin = {
  id: 'qun_044_placeholder',
  name: 'QUN044技能',
  generalId: QUN044,
  type: 'passive',
  description: 'TODO: 待导入QUN044技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun044Skills: SkillPlugin[] = [qun044Placeholder];
