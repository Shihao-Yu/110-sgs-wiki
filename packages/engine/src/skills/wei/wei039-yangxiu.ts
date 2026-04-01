/**
 * WEI039 杨修 (Yang Xiu) — 度龙品酥
 *
 * 鸡肋 (Jilei): When you take damage, you may declare a card type (basic,
 * tool, or equipment). The damage source cannot discard or use cards of
 * that type until your next turn.
 *
 * 啖酪 (Danlao): When a tool card targets more than one player and you are
 * one of the targets, you may draw 1 card and cancel the effect on you.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const jilei: SkillPlugin = {
  id: 'skill_jilei',
  name: '鸡肋',
  generalId: 'general_wei_042' as GeneralId,
  type: 'passive',
  description:
    '当你受到伤害后，你可以声明一种牌的类别，伤害来源不能使用、打出或弃置该类别的手牌直到你的下个回合。',
  triggers: ['damage'],

  // TODO: Requires card-type restriction and multi-turn state tracking
  canActivate: () => false,

  activate() {
    /* Awaiting card-type restriction infrastructure */
  },
};

export const danlao: SkillPlugin = {
  id: 'skill_danlao',
  name: '啖酪',
  generalId: 'general_wei_042' as GeneralId,
  type: 'passive',
  description:
    '当一张锦囊牌指定了多个目标且你是其中之一时，你可以摸一张牌并令此牌对你无效。',
  triggers: ['phaseChange'],

  // TODO: Requires multi-target tool card interception
  canActivate: () => false,

  activate() {
    /* Awaiting multi-target tool card infrastructure */
  },
};

export const wei039Skills: SkillPlugin[] = [jilei, danlao];
