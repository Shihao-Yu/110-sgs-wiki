/**
 * QUN056 刘封 (Liu Feng) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN056 = 'QUN056' as GeneralId;

export const qun056Placeholder: SkillPlugin = {
  id: 'qun_056_placeholder',
  name: 'QUN056技能',
  generalId: QUN056,
  type: 'passive',
  description: 'TODO: 待导入QUN056技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun056Skills: SkillPlugin[] = [qun056Placeholder];
