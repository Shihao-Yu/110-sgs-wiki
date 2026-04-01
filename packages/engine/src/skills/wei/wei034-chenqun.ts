/**
 * WEI034 陈群 (Chen Qun) — 万世臣表
 *
 * 定品 (Dingpin): Once per play phase, you may give a hand card to another
 * player. If the card has a type different from all cards in their equipment
 * area, they draw 1 card.
 *
 * 法恩 (Faen): When another player's general is turned face up or that
 * player leaves the brink of death, you may let them draw 1 card.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const dingpin: SkillPlugin = {
  id: 'skill_dingpin',
  name: '定品',
  generalId: 'general_wei_035' as GeneralId,
  type: 'active',
  description:
    '出牌阶段限一次，你可以将一张手牌交给一名其他角色，若此牌与该角色装备区内所有牌类别均不同，该角色摸一张牌。',
  triggers: ['phaseChange'],

  // TODO: Requires card-giving and equipment-type-comparison infrastructure
  canActivate: () => false,

  activate() {
    /* Awaiting card-give infrastructure */
  },
};

export const faen: SkillPlugin = {
  id: 'skill_faen',
  name: '法恩',
  generalId: 'general_wei_035' as GeneralId,
  type: 'passive',
  description:
    '当一名角色翻面或脱离濒死状态后，你可以令其摸一张牌。',
  triggers: ['phaseChange'],

  // TODO: Requires flip-state and dying-state events
  canActivate: () => false,

  activate() {
    /* Awaiting flip/dying-state event infrastructure */
  },
};

export const wei034Skills: SkillPlugin[] = [dingpin, faen];
