/**
 * WEI014 曹彰 (Cao Zhang)
 *
 * 将驰 (General's Charge / Jiangchi): During draw phase, choose one:
 * - Draw 1 extra card but cannot use/play Slash this turn; OR
 * - Draw 1 fewer card but Slash has no usage limit this turn.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const jiangchi: SkillPlugin = {
  id: 'skill_jiangchi',
  name: '将驰',
  generalId: 'general_caozhang' as GeneralId,
  type: 'passive',
  description:
    '摸牌阶段，你可以选择一项：多摸一张牌，本回合不能使用或打出【杀】；或少摸一张牌，本回合使用【杀】无距离和次数限制。',
  triggers: ['phaseChange'],

  // TODO: Requires slash-limit modifier infrastructure
  canActivate: () => false,

  activate() {
    /* Awaiting slash usage modifier infrastructure */
  },
};

export const wei014Skills: SkillPlugin[] = [jiangchi];
