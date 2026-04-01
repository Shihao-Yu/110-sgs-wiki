/**
 * QUN070 刘璋 (Liu Zhang) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN070 = 'QUN070' as GeneralId;

export const qun070Placeholder: SkillPlugin = {
  id: 'qun_070_placeholder',
  name: 'QUN070技能',
  generalId: QUN070,
  type: 'passive',
  description: 'TODO: 待导入QUN070技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun070Skills: SkillPlugin[] = [qun070Placeholder];
