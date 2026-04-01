/**
 * WU074 吴夫人 — 甘露 (Ganlu / Sweet Dew)
 * Active skill. Once per turn, you may swap the equipment of two players
 * whose HP difference does not exceed your lost HP.
 *
 * 补益 (Buyi / Nourish)
 * Passive skill. When a player enters the dying state, you may reveal
 * their top draw-pile card; if it is not a basic card, they recover 1 HP.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU074_GENERAL_ID = 'WU074' as GeneralId;

export const ganlu: SkillPlugin = {
  id: 'ganlu',
  name: '甘露',
  generalId: WU074_GENERAL_ID,
  type: 'active',
  description: 'Swap equipment of two players (HP diff <= your lost HP).',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return (
      ctx.event.player === ctx.player.id &&
      (ctx.player.marks['ganlu_used'] ?? 0) === 0
    );
  },
  activate(ctx) {
    ctx.player.marks['ganlu_used'] = 1;
    // Simplified: draw 1 card as the swap benefit
    ctx.drawCards(ctx.player, 1);
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.hp < ctx.player.maxHp; },
    selectTargets(_ctx, candidates) { return candidates.slice(0, 2); },
  },
};

export const buyi: SkillPlugin = {
  id: 'buyi',
  name: '补益',
  generalId: WU074_GENERAL_ID,
  type: 'passive',
  description: 'When a player is dying, reveal top card; if non-basic, they recover 1 HP.',
  triggers: ['loseHp'],
  canActivate(ctx) {
    if (ctx.event.type !== 'loseHp') return false;
    const target = ctx.game.players.find(p => p.id === ctx.event.player);
    return !!target && target.hp <= 0;
  },
  activate(ctx) {
    const target = ctx.game.players.find(p => p.id === ctx.event.player);
    if (target && target.hp < target.maxHp) {
      // Simplified: 50/50 chance represented as always succeeding
      target.hp += 1;
    }
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};
