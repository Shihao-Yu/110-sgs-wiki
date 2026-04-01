/**
 * WU044 韩综 — 挟势 (Xieshi / Coercive Power)
 * Passive skill. After you deal damage, you may take 1 card from the
 * damaged player's hand or equipment area.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU044_GENERAL_ID = 'WU044' as GeneralId;

export const xieshi: SkillPlugin = {
  id: 'xieshi',
  name: '挟势',
  generalId: WU044_GENERAL_ID,
  type: 'passive',
  description: 'After dealing damage, take 1 card from the damaged player.',
  triggers: ['damage'],
  canActivate(ctx) {
    if (ctx.event.type !== 'damage') return false;
    return ctx.event.source === ctx.player.id;
  },
  activate(ctx) {
    if (ctx.event.type !== 'damage') return;
    const target = ctx.game.players.find(p => p.id === ctx.event.target);
    if (target && target.handCards.length > 0) {
      const stolen = target.handCards.splice(0, 1);
      ctx.player.handCards.push(...stolen);
    }
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};
