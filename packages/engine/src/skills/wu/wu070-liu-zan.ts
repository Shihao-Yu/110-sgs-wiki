/**
 * WU070 留赞 — 奋命 (Fenming / Risk One's Life)
 * Active skill. Once per turn, you may lose 1 HP to discard 1 card from
 * each other player.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU070_GENERAL_ID = 'WU070' as GeneralId;

export const fenming: SkillPlugin = {
  id: 'fenmingAlt',
  name: '奋命',
  generalId: WU070_GENERAL_ID,
  type: 'active',
  description: 'Lose 1 HP to discard 1 card from each other player.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return (
      ctx.event.player === ctx.player.id &&
      ctx.player.hp > 1 &&
      (ctx.player.marks['fenmingAlt_used'] ?? 0) === 0
    );
  },
  activate(ctx) {
    ctx.player.marks['fenmingAlt_used'] = 1;
    ctx.player.hp -= 1;
    const others = ctx.game.players.filter(
      p => p.id !== ctx.player.id && p.alive && p.handCards.length > 0,
    );
    for (const other of others) {
      ctx.discardCards(other, [other.handCards[0]!]);
    }
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.hp >= 3; },
    selectTargets() { return []; },
  },
};
