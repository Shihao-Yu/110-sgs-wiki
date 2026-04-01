/**
 * WEI043 诸葛诞 (Zhuge Dan) — 严毅威重
 *
 * 功献 (Gongxian): At start of play phase, you may give a hand card to
 * another player; if so, for each card they have more than you this turn,
 * you may deal 1 damage to them.
 *
 * 举义 (Juyi): Awakening skill — when your HP is 1 at start of your turn,
 * you recover to max HP and draw cards equal to the number of other players.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const gongxian: SkillPlugin = {
  id: 'skill_gongxian',
  name: '功献',
  generalId: 'general_wei_050' as GeneralId,
  type: 'active',
  description:
    '出牌阶段开始时，你可以将一张手牌交给一名其他角色；你对手牌数多于你的角色使用牌无距离限制。',
  triggers: ['phaseChange'],

  // TODO: Requires card-give and distance modifier
  canActivate: () => false,

  activate() {
    /* Awaiting card-give and distance modifier infrastructure */
  },
};

export const juyi: SkillPlugin = {
  id: 'skill_juyi',
  name: '举义',
  generalId: 'general_wei_050' as GeneralId,
  type: 'passive',
  description:
    '觉醒技，准备阶段开始时，若你的体力值为1，你回复体力至上限，然后摸其他角色数量的牌。',
  triggers: ['phaseChange'],

  // TODO: Requires awakening skill infrastructure
  canActivate: () => false,

  activate() {
    /* Awaiting awakening skill infrastructure */
  },
};

export const wei043Skills: SkillPlugin[] = [gongxian, juyi];
