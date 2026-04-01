/**
 * SHU018 马岱 (Ma Dai)
 *
 * 潜袭 (Qianxi / Ambush): At the start of your play phase, you may
 * discard 1 card and choose a player in distance 1. That player cannot
 * use/play a card of the discarded card's color until end of turn.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const qianxi: SkillPlugin = {
  id: 'qianxi',
  name: '潜袭',
  generalId: 'SHU018' as GeneralId,
  type: 'active',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu018Skills: SkillPlugin[] = [qianxi];
