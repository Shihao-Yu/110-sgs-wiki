/**
 * QUN024 淳于琼 (Chunyu Qiong) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN024 = 'QUN024' as GeneralId;

export const qun024Placeholder: SkillPlugin = {
  id: 'qun_024_placeholder',
  name: 'QUN024技能',
  generalId: QUN024,
  type: 'passive',
  description: 'TODO: 待导入QUN024技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun024Skills: SkillPlugin[] = [qun024Placeholder];
