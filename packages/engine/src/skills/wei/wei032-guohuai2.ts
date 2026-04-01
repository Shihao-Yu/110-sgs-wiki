/**
 * WEI032 郭淮 (Guo Huai) — 蓄势待发
 *
 * 精策 (Jingce): At end of play phase, if the number of cards you used/played
 * this turn >= your current HP, you draw 2 cards.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const jingce: SkillPlugin = {
  id: 'skill_jingce',
  name: '精策',
  generalId: 'general_wei_032' as GeneralId,
  type: 'passive',
  description:
    '出牌阶段结束时，若你本回合使用或打出的牌数不小于你的体力值，你可以摸两张牌。',
  triggers: ['phaseChange'],

  // TODO: Requires per-turn card usage tracking
  canActivate: () => false,

  activate() {
    /* Awaiting per-turn card-usage counter infrastructure */
  },
};

export const wei032Skills: SkillPlugin[] = [jingce];
