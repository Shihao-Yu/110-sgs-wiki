/**
 * QUN055 何太后 (He Tai Hou) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN055 = 'QUN055' as GeneralId;

export const qun055Placeholder: SkillPlugin = {
  id: 'qun_055_placeholder',
  name: 'QUN055技能',
  generalId: QUN055,
  type: 'passive',
  description: 'TODO: 待导入QUN055技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun055Skills: SkillPlugin[] = [qun055Placeholder];
