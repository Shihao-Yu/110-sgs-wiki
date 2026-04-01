/**
 * QUN059 董白 (Dong Bai) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN059 = 'QUN059' as GeneralId;

export const qun059Placeholder: SkillPlugin = {
  id: 'qun_059_placeholder',
  name: 'QUN059技能',
  generalId: QUN059,
  type: 'passive',
  description: 'TODO: 待导入QUN059技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun059Skills: SkillPlugin[] = [qun059Placeholder];
