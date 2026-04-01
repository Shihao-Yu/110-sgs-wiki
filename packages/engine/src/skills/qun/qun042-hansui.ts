/**
 * QUN042 韩遂 (Han Sui) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN042 = 'QUN042' as GeneralId;

export const qun042Placeholder: SkillPlugin = {
  id: 'qun_042_placeholder',
  name: 'QUN042技能',
  generalId: QUN042,
  type: 'passive',
  description: 'TODO: 待导入QUN042技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun042Skills: SkillPlugin[] = [qun042Placeholder];
