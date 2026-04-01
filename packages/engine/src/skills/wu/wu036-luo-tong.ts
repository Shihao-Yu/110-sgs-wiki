/**
 * WU036 骆统 — 仁恕 (Renshu / Benevolent Mercy)
 * Lock skill. At the start of your draw phase, you draw X additional cards
 * where X is the number of other players who have fewer HP than you.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU036_GENERAL_ID = 'WU036' as GeneralId;

export const renshu: SkillPlugin = {
  id: 'renshu',
  name: '仁恕',
  generalId: WU036_GENERAL_ID,
  type: 'lock',
  description: 'During your draw phase, draw X extra cards (X = players with fewer HP than you).',
  triggers: ['drawCards'],
  canActivate(ctx) {
    if (ctx.event.type !== 'drawCards') return false;
    return ctx.event.player === ctx.player.id;
  },
  activate(ctx) {
    const extraDraw = ctx.game.players.filter(
      p => p.alive && p.id !== ctx.player.id && p.hp < ctx.player.hp,
    ).length;
    if (extraDraw > 0) {
      ctx.drawCards(ctx.player, extraDraw);
    }
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};
