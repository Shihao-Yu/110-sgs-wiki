/**
 * SHU029 伊籍 (Yi Ji)
 *
 * 急援 (Jiyuan / Emergency Aid): When you or another player are in dying
 * state, you may draw 1 card.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const jiyuan: SkillPlugin = {
  id: 'jiyuan',
  name: '急援',
  generalId: 'SHU029' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['loseHp'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu029Skills: SkillPlugin[] = [jiyuan];
