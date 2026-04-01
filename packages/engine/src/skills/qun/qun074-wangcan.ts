/**
 * QUN074 王粲 (Wang Can) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN074 = 'QUN074' as GeneralId;

export const qun074Placeholder: SkillPlugin = {
  id: 'qun_074_placeholder',
  name: 'QUN074技能',
  generalId: QUN074,
  type: 'passive',
  description: 'TODO: 待导入QUN074技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun074Skills: SkillPlugin[] = [qun074Placeholder];
