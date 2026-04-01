/**
 * WEI009 荀彧 (Xun Yu) — 王佐之才
 *
 * 驱虎 (Drive the Tiger / Quhu): During your play phase (once), you may
 * compete (pindian) with a player who has more HP. If you win, that player
 * deals 1 damage to another player of your choice within their range.
 *
 * 节命 (Sacrifice / Jieming): After you take 1 damage, you may let a player
 * draw 2 cards, then that player discards down to their max HP.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const quhu: SkillPlugin = {
  id: 'skill_quhu',
  name: '驱虎',
  generalId: 'general_xunyu' as GeneralId,
  type: 'active',
  description:
    '出牌阶段限一次，你可以与一名体力值大于你的角色拼点，若你赢，该角色对其攻击范围内你指定的一名角色造成1点伤害。',
  triggers: ['phaseChange'],

  // TODO: Requires pindian (compete/compare) subsystem
  canActivate: () => false,

  activate() {
    /* Awaiting pindian infrastructure */
  },
};

export const jieming: SkillPlugin = {
  id: 'skill_jieming',
  name: '节命',
  generalId: 'general_xunyu' as GeneralId,
  type: 'passive',
  description:
    '当你受到1点伤害后，你可以令一名角色摸两张牌，然后该角色将手牌弃至其体力上限。',
  triggers: ['damage'],

  canActivate(ctx) {
    if (ctx.event.type !== 'damage') return false;
    return ctx.event.target === ctx.player.id;
  },

  activate(ctx) {
    // Draw 2 cards for self (simplified — target selection by AI/UI)
    ctx.drawCards(ctx.player, 2);
    // Discard down to max HP
    while (ctx.player.handCards.length > ctx.player.maxHp) {
      const excess = ctx.player.handCards.pop();
      if (excess) ctx.game.discardPile.push(excess);
    }
  },
};

export const wei009Skills: SkillPlugin[] = [quhu, jieming];
