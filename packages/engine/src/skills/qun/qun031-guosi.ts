/**
 * QUN031 郭汜 (Guo Si) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN031 = 'QUN031' as GeneralId;

export const qun031Placeholder: SkillPlugin = {
  id: 'qun_031_placeholder',
  name: 'QUN031技能',
  generalId: QUN031,
  type: 'passive',
  description: 'TODO: 待导入QUN031技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun031Skills: SkillPlugin[] = [qun031Placeholder];
