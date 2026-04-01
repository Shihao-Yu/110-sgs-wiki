/**
 * WEI038 钟繇 (Zhong Yao) — 开达理干
 *
 * 补益 (Buyi): When another player enters dying state, you may reveal
 * the top card of the draw pile. If it is not a basic card, they recover
 * 1 HP.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const buyi: SkillPlugin = {
  id: 'skill_buyi',
  name: '补益',
  generalId: 'general_wei_039' as GeneralId,
  type: 'passive',
  description:
    '当一名角色进入濒死状态时，你可以亮出牌堆顶的一张牌：若不为基本牌，该角色回复1点体力。',
  triggers: ['damage'],

  // TODO: Requires dying-state events and card-type checking
  canActivate: () => false,

  activate() {
    /* Awaiting dying-state event infrastructure */
  },
};

export const wei038Skills: SkillPlugin[] = [buyi];
