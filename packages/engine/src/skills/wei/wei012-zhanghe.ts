/**
 * WEI012 张郃 (Zhang He) — 料敌机先
 *
 * 巧变 (Resourceful / Qiaobian): You may discard a hand card to skip a phase
 * (except prepare and end). If you skip the draw phase, take 1 card each from
 * up to 2 other players. If you skip the play phase, move a card in play to
 * another player's area.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const qiaobian: SkillPlugin = {
  id: 'skill_qiaobian',
  name: '巧变',
  generalId: 'general_zhanghe' as GeneralId,
  type: 'active',
  description:
    '你可以弃置一张手牌，跳过你的一个阶段（准备阶段和结束阶段除外）。',
  triggers: ['phaseChange'],

  // TODO: Requires phase-skipping and card-movement infrastructure
  canActivate: () => false,

  activate() {
    /* Awaiting phase-skip and field card movement infrastructure */
  },
};

export const wei012Skills: SkillPlugin[] = [qiaobian];
