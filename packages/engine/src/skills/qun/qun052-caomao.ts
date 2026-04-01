/**
 * QUN052 曹髦 (Cao Mao) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN052 = 'QUN052' as GeneralId;

export const qun052Placeholder: SkillPlugin = {
  id: 'qun_052_placeholder',
  name: 'QUN052技能',
  generalId: QUN052,
  type: 'passive',
  description: 'TODO: 待导入QUN052技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun052Skills: SkillPlugin[] = [qun052Placeholder];
