/**
 * QUN048 沙摩柯 (Sha Mo Ke) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN048 = 'QUN048' as GeneralId;

export const qun048Placeholder: SkillPlugin = {
  id: 'qun_048_placeholder',
  name: 'QUN048技能',
  generalId: QUN048,
  type: 'passive',
  description: 'TODO: 待导入QUN048技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun048Skills: SkillPlugin[] = [qun048Placeholder];
