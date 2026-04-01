/**
 * QUN057 卑弥呼 (Bei Mi Hu) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN057 = 'QUN057' as GeneralId;

export const qun057Placeholder: SkillPlugin = {
  id: 'qun_057_placeholder',
  name: 'QUN057技能',
  generalId: QUN057,
  type: 'passive',
  description: 'TODO: 待导入QUN057技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun057Skills: SkillPlugin[] = [qun057Placeholder];
