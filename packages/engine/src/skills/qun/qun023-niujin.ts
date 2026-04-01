/**
 * QUN023 牛金 (Niu Jin) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN023 = 'QUN023' as GeneralId;

export const qun023Placeholder: SkillPlugin = {
  id: 'qun_023_placeholder',
  name: 'QUN023技能',
  generalId: QUN023,
  type: 'passive',
  description: 'TODO: 待导入QUN023技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun023Skills: SkillPlugin[] = [qun023Placeholder];
