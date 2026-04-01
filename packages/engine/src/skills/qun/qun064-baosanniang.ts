/**
 * QUN064 鲍三娘 (Bao Sanniang) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN064 = 'QUN064' as GeneralId;

export const qun064Placeholder: SkillPlugin = {
  id: 'qun_064_placeholder',
  name: 'QUN064技能',
  generalId: QUN064,
  type: 'passive',
  description: 'TODO: 待导入QUN064技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun064Skills: SkillPlugin[] = [qun064Placeholder];
