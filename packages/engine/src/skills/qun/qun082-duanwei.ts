/**
 * QUN082 段煨 (Duan Wei) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN082 = 'QUN082' as GeneralId;

export const qun082Placeholder: SkillPlugin = {
  id: 'qun_082_placeholder',
  name: 'QUN082技能',
  generalId: QUN082,
  type: 'passive',
  description: 'TODO: 待导入QUN082技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun082Skills: SkillPlugin[] = [qun082Placeholder];
