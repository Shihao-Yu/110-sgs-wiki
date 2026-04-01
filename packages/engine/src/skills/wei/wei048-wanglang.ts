/**
 * WEI048 王朗 (Wang Lang) — 处尊居显
 *
 * 鼓舌 (Gushe): Once per play phase, you may compare hand cards with up
 * to 3 other players; each player who loses the comparison discards 1 card.
 * If you lose all comparisons, you lose 1 HP.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const gushe: SkillPlugin = {
  id: 'skill_gushe',
  name: '鼓舌',
  generalId: 'general_wei_058' as GeneralId,
  type: 'active',
  description:
    '出牌阶段限一次，你可以用一张手牌与至多三名其他角色同时拼点，没赢的角色各弃置一张牌。若你全没赢，你失去1点体力。',
  triggers: ['phaseChange'],

  // TODO: Requires multi-player pindian (compare) infrastructure
  canActivate: () => false,

  activate() {
    /* Awaiting pindian infrastructure */
  },
};

export const wei048Skills: SkillPlugin[] = [gushe];
