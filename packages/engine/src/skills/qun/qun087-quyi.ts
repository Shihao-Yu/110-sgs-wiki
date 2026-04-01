/**
 * QUN087 麹义 (Qu Yi) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN087 = 'QUN087' as GeneralId;

export const qun087Placeholder: SkillPlugin = {
  id: 'qun_087_placeholder',
  name: 'QUN087技能',
  generalId: QUN087,
  type: 'passive',
  description: 'TODO: 待导入QUN087技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun087Skills: SkillPlugin[] = [qun087Placeholder];
