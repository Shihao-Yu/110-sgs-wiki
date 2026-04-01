/**
 * WEI042 曹昂 (Cao Ang) — 孝战生死
 *
 * 慷忾 (Kangkai): When a player within your attack range becomes the target
 * of a Slash, you may draw 1 card and give them a card. If the given card
 * is an equipment card, they may equip it.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const kangkai: SkillPlugin = {
  id: 'skill_kangkai',
  name: '慷忾',
  generalId: 'general_wei_049' as GeneralId,
  type: 'passive',
  description:
    '当你攻击范围内的一名角色成为【杀】的目标时，你可以摸一张牌，然后将一张牌交给该角色。若此牌为装备牌，该角色可以使用之。',
  triggers: ['phaseChange'],

  // TODO: Requires attack-range checking and slash-target events
  canActivate: () => false,

  activate() {
    /* Awaiting attack-range and slash-target infrastructure */
  },
};

export const wei042Skills: SkillPlugin[] = [kangkai];
