/**
 * SHU093 刘备·主 (Liu Bei — Lord variant)
 *
 * 激将 (Jijiang / Rouse): Placeholder.
 * 仁德·主 (Rende Lord / Benevolence Lord): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const jijiang: SkillPlugin = {
  id: 'jijiang',
  name: '激将',
  generalId: 'SHU093' as GeneralId,
  type: 'active',
  description: '待补充',
  triggers: ['playCard'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const rendeLord: SkillPlugin = {
  id: 'rende_lord',
  name: '仁德·主',
  generalId: 'SHU093' as GeneralId,
  type: 'active',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu093Skills: SkillPlugin[] = [jijiang, rendeLord];
