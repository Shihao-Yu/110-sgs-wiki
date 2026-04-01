/**
 * QUN068 刘表 (Liu Biao) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN068 = 'QUN068' as GeneralId;

export const qun068Placeholder: SkillPlugin = {
  id: 'qun_068_placeholder',
  name: 'QUN068技能',
  generalId: QUN068,
  type: 'passive',
  description: 'TODO: 待导入QUN068技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun068Skills: SkillPlugin[] = [qun068Placeholder];
