/**
 * QUN033 范疆&张达 (Fan Jiang & Zhang Da) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN033 = 'QUN033' as GeneralId;

export const qun033Placeholder: SkillPlugin = {
  id: 'qun_033_placeholder',
  name: 'QUN033技能',
  generalId: QUN033,
  type: 'passive',
  description: 'TODO: 待导入QUN033技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun033Skills: SkillPlugin[] = [qun033Placeholder];
