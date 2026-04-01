/**
 * SHU074 陈到 (Chen Dao)
 *
 * 白毦 (Baier / White Feather Guard): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const baier: SkillPlugin = {
  id: 'baier',
  name: '白毦',
  generalId: 'SHU074' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['damage'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu074Skills: SkillPlugin[] = [baier];
