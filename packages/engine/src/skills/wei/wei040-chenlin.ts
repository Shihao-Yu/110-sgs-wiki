/**
 * WEI040 陈琳 (Chen Lin) — 笔篆凌云
 *
 * 笔伐 (Bifa): At end of turn, you may place a hand card face-down in front
 * of another player. That player must show a card of the same type or lose
 * 1 HP at the start of their turn.
 *
 * 颂词 (Songci): Once per play phase, you may let a player draw cards or
 * discard cards to match the number of generals they have revealed.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const bifa: SkillPlugin = {
  id: 'skill_bifa',
  name: '笔伐',
  generalId: 'general_wei_043' as GeneralId,
  type: 'active',
  description:
    '结束阶段，你可以将一张手牌扣置在一名其他角色面前。该角色回合开始时须展示相同类别的牌或失去1点体力。',
  triggers: ['phaseChange'],

  // TODO: Requires face-down card placement and turn-start reveal
  canActivate: () => false,

  activate() {
    /* Awaiting face-down card placement infrastructure */
  },
};

export const songci: SkillPlugin = {
  id: 'skill_songci',
  name: '颂词',
  generalId: 'general_wei_043' as GeneralId,
  type: 'active',
  description:
    '出牌阶段限一次，你可以令一名角色摸或弃置牌至与其已明置的武将牌数量相同。',
  triggers: ['phaseChange'],

  // TODO: Requires revealed general count and draw/discard-to-target
  canActivate: () => false,

  activate() {
    /* Awaiting revealed general count infrastructure */
  },
};

export const wei040Skills: SkillPlugin[] = [bifa, songci];
