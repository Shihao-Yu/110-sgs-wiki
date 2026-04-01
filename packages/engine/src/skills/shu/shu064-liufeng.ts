/**
 * SHU064 刘封 (Liu Feng)
 *
 * 陷嗣 (Xiansi / Entrapping Heir): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const xiansi: SkillPlugin = {
  id: 'xiansi',
  name: '陷嗣',
  generalId: 'SHU064' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu064Skills: SkillPlugin[] = [xiansi];
