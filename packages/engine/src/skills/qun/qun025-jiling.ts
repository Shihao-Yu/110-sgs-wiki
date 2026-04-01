/**
 * QUN025 纪灵 (Ji Ling) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN025 = 'QUN025' as GeneralId;

export const qun025Placeholder: SkillPlugin = {
  id: 'qun_025_placeholder',
  name: 'QUN025技能',
  generalId: QUN025,
  type: 'passive',
  description: 'TODO: 待导入QUN025技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun025Skills: SkillPlugin[] = [qun025Placeholder];
