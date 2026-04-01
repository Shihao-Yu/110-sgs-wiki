/**
 * SHU037 王平 (Wang Ping)
 *
 * 严整 (Yanzheng / Strict Formation): Placeholder.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const yanzheng: SkillPlugin = {
  id: 'yanzheng',
  name: '严整',
  generalId: 'SHU037' as GeneralId,
  type: 'passive',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu037Skills: SkillPlugin[] = [yanzheng];
