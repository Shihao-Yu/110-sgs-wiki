/**
 * QUN073 严白虎 (Yan Baihu) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN073 = 'QUN073' as GeneralId;

export const qun073Placeholder: SkillPlugin = {
  id: 'qun_073_placeholder',
  name: 'QUN073技能',
  generalId: QUN073,
  type: 'passive',
  description: 'TODO: 待导入QUN073技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun073Skills: SkillPlugin[] = [qun073Placeholder];
