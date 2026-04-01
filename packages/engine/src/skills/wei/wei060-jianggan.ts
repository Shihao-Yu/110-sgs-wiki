/**
 * WEI060 蒋干 (Jiang Gan) — 千帆征战
 *
 * 盗书 (Daoshu): At start of another player's turn, you may swap
 * a hand card with one of their hand cards (face-down).
 *
 * 游说 (Youshui): Placeholder for additional skill mechanics.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const daoshu: SkillPlugin = {
  id: 'skill_daoshu',
  name: '盗书',
  generalId: 'general_wei_075' as GeneralId,
  type: 'active',
  description:
    '一名其他角色的回合开始时，你可以用一张手牌与其交换一张手牌（暗置）。',
  triggers: ['phaseChange'],

  // TODO: Requires turn-start events for other players and card-swap
  canActivate: () => false,

  activate() {
    /* Awaiting turn-start event and card-swap infrastructure */
  },
};

export const wei060Skills: SkillPlugin[] = [daoshu];
