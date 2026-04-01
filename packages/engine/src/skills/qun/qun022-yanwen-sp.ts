/**
 * QUN022 颜良文丑(SP) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN022 = 'QUN022' as GeneralId;

export const qun022Placeholder: SkillPlugin = {
  id: 'qun_022_placeholder',
  name: 'QUN022技能',
  generalId: QUN022,
  type: 'passive',
  description: 'TODO: 待导入QUN022技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun022Skills: SkillPlugin[] = [qun022Placeholder];
