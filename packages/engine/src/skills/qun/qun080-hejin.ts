/**
 * QUN080 何进 (He Jin) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN080 = 'QUN080' as GeneralId;

export const qun080Placeholder: SkillPlugin = {
  id: 'qun_080_placeholder',
  name: 'QUN080技能',
  generalId: QUN080,
  type: 'passive',
  description: 'TODO: 待导入QUN080技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun080Skills: SkillPlugin[] = [qun080Placeholder];
