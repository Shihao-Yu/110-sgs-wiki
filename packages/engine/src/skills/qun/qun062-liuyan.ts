/**
 * QUN062 刘焉 (Liu Yan) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN062 = 'QUN062' as GeneralId;

export const qun062Placeholder: SkillPlugin = {
  id: 'qun_062_placeholder',
  name: 'QUN062技能',
  generalId: QUN062,
  type: 'passive',
  description: 'TODO: 待导入QUN062技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun062Skills: SkillPlugin[] = [qun062Placeholder];
