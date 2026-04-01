/**
 * WU006 大乔 — 流离 (Liuli / Deflect)
 * Passive skill. When you are targeted by 杀 (Slash), you may discard a
 * diamond-suited card to redirect the Slash to another player within range.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU006_GENERAL_ID = 'WU006' as GeneralId;

export const liuli: SkillPlugin = {
  id: 'liuli',
  name: '流离',
  generalId: WU006_GENERAL_ID,
  type: 'passive',
  description:
    'When targeted by 杀, discard a diamond card to redirect it to another player.',
  triggers: ['playCard'],

  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    // Check if this is a Slash targeting us
    const cardName = ctx.event.card.name;
    if (cardName !== 'Slash' && cardName !== '杀') return false;

    const targets = ctx.event.targets ?? [];
    if (!targets.includes(ctx.player.id)) return false;

    // Must have a diamond card to discard
    return ctx.player.handCards.some(c => c.suit === 'diamond');
  },

  activate(ctx) {
    if (ctx.event.type !== 'playCard') return;

    // Find and discard a diamond card from hand
    const diamondIndex = ctx.player.handCards.findIndex(c => c.suit === 'diamond');
    if (diamondIndex === -1) return;

    const diamondCard = ctx.player.handCards[diamondIndex]!;
    ctx.discardCards(ctx.player, [diamondCard]);

    // Redirect — change the target in the event
    // Find another valid player to redirect to
    const otherPlayers = ctx.game.players.filter(
      p => p.id !== ctx.player.id && p.id !== ctx.event.player && p.alive,
    );
    if (otherPlayers.length === 0) return;

    const newTarget = otherPlayers[0]!;
    if (ctx.event.targets) {
      const myIndex = ctx.event.targets.indexOf(ctx.player.id);
      if (myIndex !== -1) {
        ctx.event.targets[myIndex] = newTarget.id;
      }
    }
  },

  ai: {
    shouldActivate(ctx) {
      if (ctx.event.type !== 'playCard') return false;
      const cardName = ctx.event.card.name;
      return (cardName === 'Slash' || cardName === '杀') &&
        ctx.player.handCards.some(c => c.suit === 'diamond');
    },
    selectTargets(_ctx, candidates) {
      return candidates.slice(0, 1);
    },
  },
};
