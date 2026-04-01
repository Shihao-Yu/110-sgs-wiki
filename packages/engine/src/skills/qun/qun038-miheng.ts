/**
 * QUN038 祢衡 (Mi Heng) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN038 = 'QUN038' as GeneralId;

export const qun038Placeholder: SkillPlugin = {
  id: 'qun_038_placeholder',
  name: 'QUN038技能',
  generalId: QUN038,
  type: 'passive',
  description: 'TODO: 待导入QUN038技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun038Skills: SkillPlugin[] = [qun038Placeholder];
