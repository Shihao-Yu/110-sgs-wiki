/**
 * QUN051 王元姬 (Wang Yuan Ji) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN051 = 'QUN051' as GeneralId;

export const qun051Placeholder: SkillPlugin = {
  id: 'qun_051_placeholder',
  name: 'QUN051技能',
  generalId: QUN051,
  type: 'passive',
  description: 'TODO: 待导入QUN051技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun051Skills: SkillPlugin[] = [qun051Placeholder];
