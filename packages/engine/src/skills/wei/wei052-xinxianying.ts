/**
 * WEI052 辛宪英 (Xin Xianying) — 凤翥鸾回
 *
 * 忠鉴 (Zhongjian): When a player becomes the target of a Slash or Duel
 * (not by you), you may give them a card. If the card is the same color
 * as the card that targeted them, they draw 1.
 *
 * 存愿 (Cunyuan): Limited skill — when you are about to die, you may
 * let another player draw 3 cards.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const zhongjian: SkillPlugin = {
  id: 'skill_zhongjian',
  name: '忠鉴',
  generalId: 'general_wei_064' as GeneralId,
  type: 'passive',
  description:
    '当一名角色成为【杀】或【决斗】的目标时（非你使用），你可以将一张牌交给该角色。',
  triggers: ['phaseChange'],

  // TODO: Requires slash/duel target events
  canActivate: () => false,

  activate() {
    /* Awaiting slash/duel target infrastructure */
  },
};

export const cunyuan: SkillPlugin = {
  id: 'skill_cunyuan',
  name: '存愿',
  generalId: 'general_wei_064' as GeneralId,
  type: 'passive',
  description:
    '限定技，当你进入濒死状态时，你可以令一名其他角色摸三张牌。',
  triggers: ['damage'],

  // TODO: Requires dying-state and limited-skill tracking
  canActivate: () => false,

  activate() {
    /* Awaiting dying-state and limited-skill infrastructure */
  },
};

export const wei052Skills: SkillPlugin[] = [zhongjian, cunyuan];
