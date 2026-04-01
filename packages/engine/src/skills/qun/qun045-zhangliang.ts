/**
 * QUN045 张梁 (Zhang Liang) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN045 = 'QUN045' as GeneralId;

export const qun045Placeholder: SkillPlugin = {
  id: 'qun_045_placeholder',
  name: 'QUN045技能',
  generalId: QUN045,
  type: 'passive',
  description: 'TODO: 待导入QUN045技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun045Skills: SkillPlugin[] = [qun045Placeholder];
