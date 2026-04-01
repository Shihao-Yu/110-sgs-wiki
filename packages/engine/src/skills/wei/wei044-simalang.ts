/**
 * WEI044 司马朗 (Sima Lang) — 去疾还瑞
 *
 * 趣舍 (Qushe): During your play phase, you may discard a card to let
 * a player recover 1 HP; if you do, your hand limit is -1 this turn.
 *
 * 豹变 (Baobian): Compulsory — when your HP changes, you may obtain
 * certain skills based on HP threshold.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const qushe: SkillPlugin = {
  id: 'skill_qushe',
  name: '趣舍',
  generalId: 'general_wei_052' as GeneralId,
  type: 'active',
  description:
    '出牌阶段，你可以弃置一张牌令一名角色回复1点体力，然后本回合手牌上限-1。',
  triggers: ['phaseChange'],

  // TODO: Requires HP recovery and hand-limit modifier
  canActivate: () => false,

  activate() {
    /* Awaiting HP recovery and hand-limit modifier infrastructure */
  },
};

export const wei044Skills: SkillPlugin[] = [qushe];
