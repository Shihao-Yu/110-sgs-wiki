/**
 * WEI011 夏侯渊 (Xiahou Yuan) — 疾行的猎豹
 *
 * 神速 (Godspeed / Shensu): You may do one or both:
 * 1. Skip judgment and draw phases — treat as using Slash on a target.
 * 2. Skip play phase and discard an equipment — treat as using Slash on a target.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const shensu: SkillPlugin = {
  id: 'skill_shensu',
  name: '神速',
  generalId: 'general_xiahouyuan' as GeneralId,
  type: 'active',
  description:
    '你可以做以下一项或两项：1.跳过判定阶段和摸牌阶段，视为对一名角色使用一张【杀】；2.跳过出牌阶段并弃置一张装备牌，视为对一名角色使用一张【杀】。',
  triggers: ['phaseChange'],

  // TODO: Requires phase-skipping and virtual card infrastructure
  canActivate: () => false,

  activate() {
    /* Awaiting phase-skip and virtual Slash infrastructure */
  },
};

export const wei011Skills: SkillPlugin[] = [shensu];
