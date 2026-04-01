/**
 * QUN081 蒋干 (Jiang Gan) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN081 = 'QUN081' as GeneralId;

export const qun081Placeholder: SkillPlugin = {
  id: 'qun_081_placeholder',
  name: 'QUN081技能',
  generalId: QUN081,
  type: 'passive',
  description: 'TODO: 待导入QUN081技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun081Skills: SkillPlugin[] = [qun081Placeholder];
