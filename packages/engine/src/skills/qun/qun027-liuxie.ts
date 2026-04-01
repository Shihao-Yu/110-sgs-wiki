/**
 * QUN027 刘协 (Liu Xie) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN027 = 'QUN027' as GeneralId;

export const qun027Placeholder: SkillPlugin = {
  id: 'qun_027_placeholder',
  name: 'QUN027技能',
  generalId: QUN027,
  type: 'passive',
  description: 'TODO: 待导入QUN027技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun027Skills: SkillPlugin[] = [qun027Placeholder];
