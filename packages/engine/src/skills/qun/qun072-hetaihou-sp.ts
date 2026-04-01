/**
 * QUN072 何太后(SP) (He Taihou SP) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN072 = 'QUN072' as GeneralId;

export const qun072Placeholder: SkillPlugin = {
  id: 'qun_072_placeholder',
  name: 'QUN072技能',
  generalId: QUN072,
  type: 'passive',
  description: 'TODO: 待导入QUN072技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun072Skills: SkillPlugin[] = [qun072Placeholder];
