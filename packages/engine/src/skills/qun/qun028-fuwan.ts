/**
 * QUN028 伏完 (Fu Wan) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN028 = 'QUN028' as GeneralId;

export const qun028Placeholder: SkillPlugin = {
  id: 'qun_028_placeholder',
  name: 'QUN028技能',
  generalId: QUN028,
  type: 'passive',
  description: 'TODO: 待导入QUN028技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun028Skills: SkillPlugin[] = [qun028Placeholder];
