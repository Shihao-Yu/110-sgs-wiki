/**
 * WEI005 许褚 (Xu Chu) — 虎痴
 *
 * 裸衣 (Bare-chested / Luoyi): During your draw phase, you may draw 1 fewer
 * card. If you do, your 杀 (Slash) and 决斗 (Duel) deal +1 damage this turn.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const luoyi: SkillPlugin = {
  id: 'skill_luoyi',
  name: '裸衣',
  generalId: 'general_xuchu' as GeneralId,
  type: 'passive',
  description:
    '摸牌阶段，你可以少摸一张牌，若如此做，本回合你使用【杀】或【决斗】造成的伤害+1。',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'draw') return false;
    return ctx.event.player === ctx.player.id;
  },

  activate(ctx) {
    // Draw 1 card instead of 2 (skip 1)
    ctx.drawCards(ctx.player, 1);

    // Mark this player as having Luoyi active for the turn.
    // Damage resolution would check this mark to add +1 to Slash/Duel damage.
    ctx.player.marks['luoyi_active'] = 1;
  },
};

export const wei005Skills: SkillPlugin[] = [luoyi];
