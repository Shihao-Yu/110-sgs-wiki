/**
 * QUN047 潘双 (Pan Shuang) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN047 = 'QUN047' as GeneralId;

export const qun047Placeholder: SkillPlugin = {
  id: 'qun_047_placeholder',
  name: 'QUN047技能',
  generalId: QUN047,
  type: 'passive',
  description: 'TODO: 待导入QUN047技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun047Skills: SkillPlugin[] = [qun047Placeholder];
