/**
 * WU064 孙茹 — 秘计 (Miji / Secret Plan)
 * Passive skill. At the end of your turn, if you have lost HP, you may
 * draw cards equal to your lost HP and give them to another player.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU064_GENERAL_ID = 'WU064' as GeneralId;

export const miji: SkillPlugin = {
  id: 'miji',
  name: '秘计',
  generalId: WU064_GENERAL_ID,
  type: 'passive',
  description: 'At turn end, if damaged, draw cards equal to lost HP and give them away.',
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
    const lostHp = ctx.player.maxHp - ctx.player.hp;
    ctx.drawCards(ctx.player, lostHp);
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.hp < ctx.player.maxHp; },
    selectTargets(_ctx, candidates) { return candidates.slice(0, 1); },
  },
};
