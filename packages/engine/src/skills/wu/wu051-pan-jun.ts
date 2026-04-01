/**
 * WU051 潘濬 — 义舍 (Yishe / Righteous Sacrifice)
 * Passive skill. At the end of each round, if you have no "rice" tokens,
 * you gain 1 "rice". During another player's dying phase, you may remove
 * 1 "rice" to let them recover 1 HP.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU051_GENERAL_ID = 'WU051' as GeneralId;

export const yishe: SkillPlugin = {
  id: 'yishe',
  name: '义舍',
  generalId: WU051_GENERAL_ID,
  type: 'passive',
  description: 'Gain "rice" tokens each round; spend them to save dying players.',
  triggers: ['phaseChange', 'loseHp'],
  canActivate(ctx) {
    if (ctx.event.type === 'phaseChange') {
      return ctx.event.player === ctx.player.id && ctx.event.phase === 'end';
    }
    if (ctx.event.type === 'loseHp') {
      const target = ctx.game.players.find(p => p.id === ctx.event.player);
      return (
        target !== undefined &&
        target.hp <= 0 &&
        target.id !== ctx.player.id &&
        (ctx.player.marks['yishe_rice'] ?? 0) > 0
      );
    }
    return false;
  },
  activate(ctx) {
    if (ctx.event.type === 'phaseChange') {
      if ((ctx.player.marks['yishe_rice'] ?? 0) === 0) {
        ctx.player.marks['yishe_rice'] = 1;
      }
    } else if (ctx.event.type === 'loseHp') {
      const target = ctx.game.players.find(p => p.id === ctx.event.player);
      if (target && (ctx.player.marks['yishe_rice'] ?? 0) > 0) {
        ctx.player.marks['yishe_rice'] = (ctx.player.marks['yishe_rice'] ?? 0) - 1;
        target.hp += 1;
      }
    }
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};
