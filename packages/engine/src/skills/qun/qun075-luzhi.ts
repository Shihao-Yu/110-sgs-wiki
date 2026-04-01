/**
 * QUN075 卢植 (Lu Zhi) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN075 = 'QUN075' as GeneralId;

export const qun075Placeholder: SkillPlugin = {
  id: 'qun_075_placeholder',
  name: 'QUN075技能',
  generalId: QUN075,
  type: 'passive',
  description: 'TODO: 待导入QUN075技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun075Skills: SkillPlugin[] = [qun075Placeholder];
