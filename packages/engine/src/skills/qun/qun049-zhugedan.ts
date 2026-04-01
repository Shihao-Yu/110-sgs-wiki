/**
 * QUN049 诸葛诞 (Zhuge Dan) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN049 = 'QUN049' as GeneralId;

export const qun049Placeholder: SkillPlugin = {
  id: 'qun_049_placeholder',
  name: 'QUN049技能',
  generalId: QUN049,
  type: 'passive',
  description: 'TODO: 待导入QUN049技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun049Skills: SkillPlugin[] = [qun049Placeholder];
