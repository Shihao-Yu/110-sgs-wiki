/**
 * QUN085 黄祖 (Huang Zu) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN085 = 'QUN085' as GeneralId;

export const qun085Placeholder: SkillPlugin = {
  id: 'qun_085_placeholder',
  name: 'QUN085技能',
  generalId: QUN085,
  type: 'passive',
  description: 'TODO: 待导入QUN085技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun085Skills: SkillPlugin[] = [qun085Placeholder];
