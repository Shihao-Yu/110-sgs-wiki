/**
 * QUN021 庞德(SP) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN021 = 'QUN021' as GeneralId;

export const qun021Placeholder: SkillPlugin = {
  id: 'qun_021_placeholder',
  name: 'QUN021技能',
  generalId: QUN021,
  type: 'passive',
  description: 'TODO: 待导入QUN021技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun021Skills: SkillPlugin[] = [qun021Placeholder];
