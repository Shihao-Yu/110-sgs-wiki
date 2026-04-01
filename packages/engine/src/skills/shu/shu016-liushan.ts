/**
 * SHU016 刘禅 (Liu Shan)
 *
 * 享乐 (Xiangle / Pleasure): Lock. When a player targets you with 杀,
 * they must discard 1 basic card or the 杀 has no effect.
 *
 * 放权 (Fangquan / Delegate Power): Skip your play phase to let another
 * player take an extra turn.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const SHU016 = 'SHU016' as GeneralId;

export const xiangle: SkillPlugin = {
  id: 'xiangle',
  name: '享乐',
  generalId: SHU016,
  type: 'lock',
  description:
    'When a player targets you with 杀, they must discard 1 basic card or the 杀 has no effect.',
  triggers: ['playCard'],

  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    if (ctx.event.card?.name !== '杀') return false;
    const targets = ctx.event.targets ?? [];
    return targets.includes(ctx.player.id);
  },

  activate(ctx) {
    if (ctx.event.type !== 'playCard') return;
    ctx.game.activeEffects.push({
      id: `xiangle_${ctx.player.id}_${ctx.game.turnCount}`,
      name: 'xiangle',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: [ctx.player.id],
      duration: 'phase',
      properties: { requireBasicDiscard: true },
    });
  },
};

export const fangquan: SkillPlugin = {
  id: 'fangquan',
  name: '放权',
  generalId: SHU016,
  type: 'active',
  description: '待补充',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* Awaiting complete skill specification */ },
};

export const shu016Skills: SkillPlugin[] = [xiangle, fangquan];
