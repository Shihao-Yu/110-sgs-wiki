/**
 * WU028 吕范 — 调度 (Diaodu / Dispatch)
 * Passive skill. At the start of each player's play phase, you may let them
 * draw 1 card or transfer one of your equip cards to them.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU028_GENERAL_ID = 'WU028' as GeneralId;

export const diaodu: SkillPlugin = {
  id: 'diaodu',
  name: '调度',
  generalId: WU028_GENERAL_ID,
  type: 'passive',
  description: 'At the start of a play phase, you may let the current player draw 1 card.',
  triggers: ['phaseChange'],
  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    return ctx.event.phase === 'play';
  },
  activate(ctx) {
    if (ctx.event.type !== 'phaseChange') return;
    const target = ctx.game.players.find(p => p.id === ctx.event.player);
    if (target) {
      ctx.drawCards(target, 1);
    }
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};
