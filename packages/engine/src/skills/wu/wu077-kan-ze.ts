/**
 * WU077 阚泽 — 陈辞 (Chenci / Present a Memorial)
 * Active skill. Once per turn, you may discard cards up to X (X = your
 * lost HP), then draw X+1 cards.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU077_GENERAL_ID = 'WU077' as GeneralId;

export const chenci: SkillPlugin = {
  id: 'chenci',
  name: '陈辞',
  generalId: WU077_GENERAL_ID,
  type: 'active',
  description: 'Discard up to X cards (X = lost HP), then draw X+1.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    const lostHp = ctx.player.maxHp - ctx.player.hp;
    return (
      ctx.event.player === ctx.player.id &&
      lostHp > 0 &&
      (ctx.player.marks['chenci_used'] ?? 0) === 0
    );
  },
  activate(ctx) {
    ctx.player.marks['chenci_used'] = 1;
    const lostHp = ctx.player.maxHp - ctx.player.hp;
    const toDiscard = Math.min(lostHp, ctx.player.handCards.length);
    if (toDiscard > 0) {
      ctx.discardCards(ctx.player, ctx.player.handCards.slice(0, toDiscard));
    }
    ctx.drawCards(ctx.player, toDiscard + 1);
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.hp < ctx.player.maxHp; },
    selectTargets() { return []; },
  },
};
