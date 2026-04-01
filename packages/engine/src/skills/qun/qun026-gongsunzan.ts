/**
 * QUN026 公孙瓒 (Gongsun Zan) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN026 = 'QUN026' as GeneralId;

export const qun026Placeholder: SkillPlugin = {
  id: 'qun_026_placeholder',
  name: 'QUN026技能',
  generalId: QUN026,
  type: 'passive',
  description: 'TODO: 待导入QUN026技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun026Skills: SkillPlugin[] = [qun026Placeholder];
