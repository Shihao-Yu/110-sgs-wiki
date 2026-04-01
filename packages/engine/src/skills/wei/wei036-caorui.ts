/**
 * WEI036 曹叡 (Cao Rui) — 大权独揽
 *
 * 明鉴 (Mingjian): Once per play phase, you may give all your hand cards
 * to another player. That player's hand limit is unlimited this turn.
 *
 * 恢拓 (Huituo): When you take damage, you may let a player draw X cards
 * (X = your lost HP) and then discard X cards.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const mingjian: SkillPlugin = {
  id: 'skill_mingjian',
  name: '明鉴',
  generalId: 'general_wei_037' as GeneralId,
  type: 'active',
  description:
    '出牌阶段限一次，你可以将所有手牌交给一名其他角色，该角色本回合手牌上限无限。',
  triggers: ['phaseChange'],

  // TODO: Requires hand-limit modifier and card-transfer infrastructure
  canActivate: () => false,

  activate() {
    /* Awaiting hand-limit modifier infrastructure */
  },
};

export const huituo: SkillPlugin = {
  id: 'skill_huituo',
  name: '恢拓',
  generalId: 'general_wei_037' as GeneralId,
  type: 'passive',
  description:
    '当你受到伤害后，你可以令一名角色摸X张牌再弃X张牌（X为你已损失的体力值）。',
  triggers: ['damage'],

  // TODO: Requires draw-then-discard pattern and target selection
  canActivate: () => false,

  activate() {
    /* Awaiting draw-then-discard pattern */
  },
};

export const wei036Skills: SkillPlugin[] = [mingjian, huituo];
