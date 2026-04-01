/**
 * QUN069 程昱 (Cheng Yu) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN069 = 'QUN069' as GeneralId;

export const qun069Placeholder: SkillPlugin = {
  id: 'qun_069_placeholder',
  name: 'QUN069技能',
  generalId: QUN069,
  type: 'passive',
  description: 'TODO: 待导入QUN069技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun069Skills: SkillPlugin[] = [qun069Placeholder];
