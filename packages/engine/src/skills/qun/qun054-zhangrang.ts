/**
 * QUN054 张让 (Zhang Rang) — 十常侍
 *
 * 搜刮 (Extortion / Sougua): During your draw phase, you may
 * forgo drawing to take 1 card from up to 2 other players instead.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN054 = 'QUN054' as GeneralId;

/**
 * 搜刮 — Take 1 card each from up to 2 other players instead of drawing.
 * Simplified: takes 1 card from the 2 players with the most hand cards.
 */
export const sougua: SkillPlugin = {
  id: 'qun_sougua',
  name: '搜刮',
  generalId: QUN054,
  type: 'active',
  description:
    '摸牌阶段，你可以放弃摸牌，改为获得最多两名其他角色各一张手牌。',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'draw') return false;
    // Must have at least one opponent with cards
    return ctx.game.players.some(
      p => p.alive && p.id !== ctx.player.id && p.handCards.length > 0,
    );
  },

  activate(ctx) {
    // Find up to 2 opponents with cards, sorted by most cards
    const targets = ctx.game.players
      .filter(p => p.alive && p.id !== ctx.player.id && p.handCards.length > 0)
      .sort((a, b) => b.handCards.length - a.handCards.length)
      .slice(0, 2);

    for (const target of targets) {
      if (target.handCards.length === 0) continue;
      const [taken] = target.handCards.splice(0, 1);
      ctx.player.handCards.push(taken);
    }
  },
};

export const qun054Skills: SkillPlugin[] = [sougua];
