/**
 * QUN076 公孙瓒(SP) (Gongsun Zan SP) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN076 = 'QUN076' as GeneralId;

export const qun076Placeholder: SkillPlugin = {
  id: 'qun_076_placeholder',
  name: 'QUN076技能',
  generalId: QUN076,
  type: 'passive',
  description: 'TODO: 待导入QUN076技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun076Skills: SkillPlugin[] = [qun076Placeholder];
