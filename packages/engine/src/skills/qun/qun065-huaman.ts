/**
 * QUN065 花鬘 (Hua Man) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN065 = 'QUN065' as GeneralId;

export const qun065Placeholder: SkillPlugin = {
  id: 'qun_065_placeholder',
  name: 'QUN065技能',
  generalId: QUN065,
  type: 'passive',
  description: 'TODO: 待导入QUN065技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun065Skills: SkillPlugin[] = [qun065Placeholder];
