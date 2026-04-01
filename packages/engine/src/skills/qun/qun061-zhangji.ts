/**
 * QUN061 张济 (Zhang Ji) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN061 = 'QUN061' as GeneralId;

export const qun061Placeholder: SkillPlugin = {
  id: 'qun_061_placeholder',
  name: 'QUN061技能',
  generalId: QUN061,
  type: 'passive',
  description: 'TODO: 待导入QUN061技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun061Skills: SkillPlugin[] = [qun061Placeholder];
