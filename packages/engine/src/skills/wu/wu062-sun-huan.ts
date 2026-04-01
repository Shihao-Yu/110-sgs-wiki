/**
 * WU062 孙桓 — 节义 (Jieyi / Righteous Integrity)
 * Passive skill. When you take damage, you may discard a red-suited card
 * to prevent 1 damage, then draw 1 card.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU062_GENERAL_ID = 'WU062' as GeneralId;

export const jieyi: SkillPlugin = {
  id: 'jieyi',
  name: '节义',
  generalId: WU062_GENERAL_ID,
  type: 'passive',
  description: 'Discard a red card to prevent 1 damage, then draw 1 card.',
  triggers: ['damage'],
  canActivate(ctx) {
    if (ctx.event.type !== 'damage') return false;
    const isTarget = ctx.event.target === ctx.player.id;
    const hasRed = ctx.player.handCards.some(
      c => c.suit === 'heart' || c.suit === 'diamond',
    );
    return isTarget && hasRed;
  },
  activate(ctx) {
    const redCard = ctx.player.handCards.find(
      c => c.suit === 'heart' || c.suit === 'diamond',
    );
    if (redCard) {
      ctx.discardCards(ctx.player, [redCard]);
      // Prevent 1 damage (simplified: recover 1 HP)
      if (ctx.player.hp < ctx.player.maxHp) {
        ctx.player.hp += 1;
      }
      ctx.drawCards(ctx.player, 1);
    }
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.hp <= 2; },
    selectTargets() { return []; },
  },
};
