/**
 * QUN053 司马师 (Sima Shi) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN053 = 'QUN053' as GeneralId;

export const qun053Placeholder: SkillPlugin = {
  id: 'qun_053_placeholder',
  name: 'QUN053技能',
  generalId: QUN053,
  type: 'passive',
  description: 'TODO: 待导入QUN053技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun053Skills: SkillPlugin[] = [qun053Placeholder];
