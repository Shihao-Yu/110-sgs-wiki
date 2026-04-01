/**
 * SHU068 兀突骨 (Wu Tu Gu)
 *
 * 藤甲 (Tengjia / Rattan Armor): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const tengjia: SkillPlugin = {
  id: 'tengjia',
  name: '藤甲',
  generalId: 'SHU068' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['damage'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu068Skills: SkillPlugin[] = [tengjia];
