/**
 * QUN019 陆逊(SP) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN019 = 'QUN019' as GeneralId;

export const qun019Placeholder: SkillPlugin = {
  id: 'qun_019_placeholder',
  name: 'QUN019技能',
  generalId: QUN019,
  type: 'passive',
  description: 'TODO: 待导入QUN019技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun019Skills: SkillPlugin[] = [qun019Placeholder];
