/**
 * QUN083 刘辟 (Liu Pi) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN083 = 'QUN083' as GeneralId;

export const qun083Placeholder: SkillPlugin = {
  id: 'qun_083_placeholder',
  name: 'QUN083技能',
  generalId: QUN083,
  type: 'passive',
  description: 'TODO: 待导入QUN083技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun083Skills: SkillPlugin[] = [qun083Placeholder];
