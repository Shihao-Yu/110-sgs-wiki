/**
 * SHU070 李儒 (Li Ru — SHU affiliation variant)
 *
 * 绝策 (Juece / Decisive Strategy): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const juece: SkillPlugin = {
  id: 'juece',
  name: '绝策',
  generalId: 'SHU070' as GeneralId,
  type: 'active',
  description: '待补充',
  triggers: ['discardCards'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu070Skills: SkillPlugin[] = [juece];
