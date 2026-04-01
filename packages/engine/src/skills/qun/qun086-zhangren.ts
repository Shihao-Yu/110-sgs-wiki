/**
 * QUN086 张任 (Zhang Ren) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN086 = 'QUN086' as GeneralId;

export const qun086Placeholder: SkillPlugin = {
  id: 'qun_086_placeholder',
  name: 'QUN086技能',
  generalId: QUN086,
  type: 'passive',
  description: 'TODO: 待导入QUN086技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun086Skills: SkillPlugin[] = [qun086Placeholder];
