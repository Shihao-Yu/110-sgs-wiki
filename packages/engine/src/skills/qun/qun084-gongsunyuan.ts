/**
 * QUN084 公孙渊 (Gongsun Yuan) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN084 = 'QUN084' as GeneralId;

export const qun084Placeholder: SkillPlugin = {
  id: 'qun_084_placeholder',
  name: 'QUN084技能',
  generalId: QUN084,
  type: 'passive',
  description: 'TODO: 待导入QUN084技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun084Skills: SkillPlugin[] = [qun084Placeholder];
