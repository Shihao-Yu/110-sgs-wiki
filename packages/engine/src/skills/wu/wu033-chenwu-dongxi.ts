/**
 * WU033 陈武&董袭 — 奋命 (Fenming / Devotion)
 * Lock skill. At the end of your turn, if you are wounded, you must
 * discard 1 card or lose 1 HP. In return, one ally draws 2 cards.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU033_GENERAL_ID = 'WU033' as GeneralId;

export const fenming: SkillPlugin = {
  id: 'fenming',
  name: '奋命',
  generalId: WU033_GENERAL_ID,
  type: 'lock',
  description: 'End of turn while wounded: discard 1 card or lose 1 HP; an ally draws 2 cards.',
  triggers: ['phaseChange'],
  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    return (
      ctx.event.player === ctx.player.id &&
      ctx.event.phase === 'end' &&
      ctx.player.hp < ctx.player.maxHp
    );
  },
  activate(ctx) {
    // Cost: discard 1 card or lose 1 HP
    if (ctx.player.handCards.length > 0) {
      ctx.discardCards(ctx.player, [ctx.player.handCards[0]!]);
    } else {
      ctx.player.hp -= 1;
    }
    // Benefit: an ally draws 2 cards (simplified: first other alive player)
    const ally = ctx.game.players.find(p => p.alive && p.id !== ctx.player.id);
    if (ally) {
      ctx.drawCards(ally, 2);
    }
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};
