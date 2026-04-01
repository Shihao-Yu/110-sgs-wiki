/**
 * WU076 孙邻 — 阀阅 (Fayue / Noble Lineage)
 * Active skill. Once per turn, you may discard 1 card to let another
 * player draw 1 card, then if they have more cards than you, you draw 1.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU076_GENERAL_ID = 'WU076' as GeneralId;

export const fayue: SkillPlugin = {
  id: 'fayue',
  name: '阀阅',
  generalId: WU076_GENERAL_ID,
  type: 'active',
  description: 'Discard 1 to let another draw 1; if they have more cards, you draw 1.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return (
      ctx.event.player === ctx.player.id &&
      ctx.player.handCards.length > 0 &&
      (ctx.player.marks['fayue_used'] ?? 0) === 0
    );
  },
  activate(ctx) {
    ctx.player.marks['fayue_used'] = 1;
    if (ctx.player.handCards.length > 0) {
      ctx.discardCards(ctx.player, [ctx.player.handCards[0]!]);
    }
    const target = ctx.game.players.find(
      p => p.id !== ctx.player.id && p.alive,
    );
    if (target) {
      ctx.drawCards(target, 1);
      if (target.handCards.length > ctx.player.handCards.length) {
        ctx.drawCards(ctx.player, 1);
      }
    }
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.handCards.length >= 2; },
    selectTargets(_ctx, candidates) { return candidates.slice(0, 1); },
  },
};
