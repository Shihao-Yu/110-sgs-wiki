/**
 * WEI004 张辽 (Zhang Liao) — 前将军
 *
 * 突袭 (Raid / Tuxi): During your draw phase, you may draw fewer cards
 * (at least 1 fewer) and instead take one hand card each from that many
 * other players.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const tuxi: SkillPlugin = {
  id: 'skill_tuxi',
  name: '突袭',
  generalId: 'general_zhangliao' as GeneralId,
  type: 'passive',
  description:
    '摸牌阶段，你可以少摸任意张牌（至少一张），然后分别从等量的其他角色处各获得一张手牌。',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'draw') return false;
    if (ctx.event.player !== ctx.player.id) return false;
    // Must have other players with hand cards
    return ctx.game.players.some(
      p => p.id !== ctx.player.id && p.alive && p.handCards.length > 0,
    );
  },

  activate(ctx) {
    // Take 1 card from up to 2 other players instead of drawing
    const targets = ctx.game.players.filter(
      p => p.id !== ctx.player.id && p.alive && p.handCards.length > 0,
    );
    const selected = targets.slice(0, 2);

    for (const target of selected) {
      if (target.handCards.length === 0) continue;
      // Take one random hand card
      const idx = Math.floor(Math.random() * target.handCards.length);
      const [stolen] = target.handCards.splice(idx, 1);
      ctx.player.handCards.push(stolen);
    }

    // Skip normal draw (draw 0 instead of 2 since we took from others)
    // The phase handler would check for skill interception
  },
};

export const wei004Skills: SkillPlugin[] = [tuxi];
