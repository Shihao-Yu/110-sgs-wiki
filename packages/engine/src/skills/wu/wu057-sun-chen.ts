/**
 * WU057 孙綝 — 灭吴 (Miewu / Destroy Wu, alt)
 * Active skill. Once per turn, you may discard 1 card to make another
 * player discard 2 cards.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU057_GENERAL_ID = 'WU057' as GeneralId;

export const miewuAlt: SkillPlugin = {
  id: 'miewuAlt',
  name: '灭吴',
  generalId: WU057_GENERAL_ID,
  type: 'active',
  description: 'Discard 1 card to force another player to discard 2 cards.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return (
      ctx.player.handCards.length > 0 &&
      (ctx.player.marks['miewuAlt_used'] ?? 0) === 0
    );
  },
  activate(ctx) {
    ctx.player.marks['miewuAlt_used'] = 1;
    if (ctx.player.handCards.length > 0) {
      ctx.discardCards(ctx.player, [ctx.player.handCards[0]!]);
    }
    const targets = ctx.event.type === 'playCard' ? (ctx.event.targets ?? []) : [];
    const target = ctx.game.players.find(p => targets.includes(p.id));
    if (target && target.handCards.length >= 2) {
      ctx.discardCards(target, target.handCards.slice(0, 2));
    }
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.handCards.length >= 2; },
    selectTargets(_ctx, candidates) { return candidates.slice(0, 1); },
  },
};
