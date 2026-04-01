/**
 * WU013 孙坚 — 英魂 (Yinghun / Spirit of the Hero)
 * Passive skill. At the start of your draw phase, if you are wounded,
 * select a player: either they draw X and discard 1, or they draw 1 and discard X
 * (where X = damage taken = maxHp - hp).
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU013_GENERAL_ID = 'WU013' as GeneralId;

export const yinghun: SkillPlugin = {
  id: 'yinghun',
  name: '英魂',
  generalId: WU013_GENERAL_ID,
  type: 'passive',
  description:
    'When wounded, at draw phase start: a player draws X/discards 1, or draws 1/discards X (X = damage taken).',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    return ctx.event.phase === 'draw' && ctx.player.hp < ctx.player.maxHp;
  },

  activate(ctx) {
    if (ctx.event.type !== 'phaseChange') return;
    const damage = ctx.player.maxHp - ctx.player.hp;
    if (damage <= 0) return;

    // Default: pick the first other alive player, option 1 (draw X, discard 1)
    const target = ctx.game.players.find(
      p => p.id !== ctx.player.id && p.alive,
    );
    if (!target) return;

    ctx.drawCards(target, damage);
    if (target.handCards.length > 0) {
      ctx.discardCards(target, [target.handCards[0]!]);
    }
  },

  ai: {
    shouldActivate(ctx) {
      return ctx.player.hp < ctx.player.maxHp;
    },
    selectTargets(_ctx, candidates) {
      return candidates.slice(0, 1);
    },
  },
};
