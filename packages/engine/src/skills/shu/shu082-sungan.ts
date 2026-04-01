/**
 * SHU082 孙乾 (Sun Qian — SP variant)
 *
 * 辞逊 (Cixun / Humble Diplomacy): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const cixun: SkillPlugin = {
  id: 'cixun',
  name: '辞逊',
  generalId: 'SHU082' as GeneralId,
  type: 'active',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu082Skills: SkillPlugin[] = [cixun];
