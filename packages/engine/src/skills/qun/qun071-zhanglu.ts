/**
 * QUN071 张鲁 (Zhang Lu) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN071 = 'QUN071' as GeneralId;

export const qun071Placeholder: SkillPlugin = {
  id: 'qun_071_placeholder',
  name: 'QUN071技能',
  generalId: QUN071,
  type: 'passive',
  description: 'TODO: 待导入QUN071技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun071Skills: SkillPlugin[] = [qun071Placeholder];
