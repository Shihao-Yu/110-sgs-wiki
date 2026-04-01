/**
 * QUN035 蹋顿 (Ta Dun) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN035 = 'QUN035' as GeneralId;

export const qun035Placeholder: SkillPlugin = {
  id: 'qun_035_placeholder',
  name: 'QUN035技能',
  generalId: QUN035,
  type: 'passive',
  description: 'TODO: 待导入QUN035技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun035Skills: SkillPlugin[] = [qun035Placeholder];
