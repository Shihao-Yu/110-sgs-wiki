/**
 * QUN041 颜良&文丑(SP) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN041 = 'QUN041' as GeneralId;

export const qun041Placeholder: SkillPlugin = {
  id: 'qun_041_placeholder',
  name: 'QUN041技能',
  generalId: QUN041,
  type: 'passive',
  description: 'TODO: 待导入QUN041技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun041Skills: SkillPlugin[] = [qun041Placeholder];
