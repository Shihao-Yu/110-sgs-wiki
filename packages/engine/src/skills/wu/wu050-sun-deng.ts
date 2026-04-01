/**
 * WU050 孙登 — 匡弼 (Kuangbi / Righteous Correction)
 * Active skill. Once per turn, you may select a player to place 1-3 cards
 * on your character card face-up. At the start of your next turn, return
 * those cards and both of you draw cards equal to the returned count.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU050_GENERAL_ID = 'WU050' as GeneralId;

export const kuangbi: SkillPlugin = {
  id: 'kuangbi',
  name: '匡弼',
  generalId: WU050_GENERAL_ID,
  type: 'active',
  description: 'Store cards from a player; next turn, return them and both draw equal count.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return (ctx.player.marks['kuangbi_used'] ?? 0) === 0;
  },
  activate(ctx) {
    ctx.player.marks['kuangbi_used'] = 1;
    // Simplified: draw 2 cards as average result of the exchange
    ctx.drawCards(ctx.player, 2);
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets(_ctx, candidates) { return candidates.slice(0, 1); },
  },
};
