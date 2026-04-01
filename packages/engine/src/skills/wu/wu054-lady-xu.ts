/**
 * WU054 徐夫人 — 低帷 (Diwei / Drawn Curtain)
 * Passive skill. When another player plays a card targeting you, you may
 * let them draw 1 card, then if they have more hand cards than you, the
 * card has no effect on you.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU054_GENERAL_ID = 'WU054' as GeneralId;

export const diwei: SkillPlugin = {
  id: 'diwei',
  name: '低帷',
  generalId: WU054_GENERAL_ID,
  type: 'passive',
  description: 'When targeted, opponent draws 1 card; if they have more cards than you, negate the card.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    const targets = ctx.event.targets ?? [];
    return (
      targets.includes(ctx.player.id) &&
      ctx.event.player !== ctx.player.id
    );
  },
  activate(ctx) {
    if (ctx.event.type !== 'playCard') return;
    const attacker = ctx.game.players.find(p => p.id === ctx.event.player);
    if (attacker) {
      ctx.drawCards(attacker, 1);
      // If attacker now has more cards, nullify
      if (attacker.handCards.length > ctx.player.handCards.length) {
        if (ctx.event.targets) {
          const idx = ctx.event.targets.indexOf(ctx.player.id);
          if (idx !== -1) {
            ctx.event.targets.splice(idx, 1);
          }
        }
      }
    }
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.handCards.length <= 2; },
    selectTargets() { return []; },
  },
};
