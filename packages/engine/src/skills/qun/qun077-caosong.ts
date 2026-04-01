/**
 * QUN077 曹嵩 (Cao Song) — placeholder
 *
 * Skills pending data import from extended QUN general set.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN077 = 'QUN077' as GeneralId;

export const qun077Placeholder: SkillPlugin = {
  id: 'qun_077_placeholder',
  name: 'QUN077技能',
  generalId: QUN077,
  type: 'passive',
  description: 'TODO: 待导入QUN077技能数据',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun077Skills: SkillPlugin[] = [qun077Placeholder];
