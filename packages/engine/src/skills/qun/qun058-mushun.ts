/**
 * QUN058 木顺 (Mu Shun) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN058 = 'QUN058' as GeneralId;

export const qun058Placeholder: SkillPlugin = {
  id: 'qun_058_placeholder',
  name: 'QUN058技能',
  generalId: QUN058,
  type: 'passive',
  description: 'TODO: 待导入QUN058技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun058Skills: SkillPlugin[] = [qun058Placeholder];
