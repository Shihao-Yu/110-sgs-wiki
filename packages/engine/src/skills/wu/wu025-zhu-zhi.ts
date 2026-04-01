/**
 * WU025 朱治 — 巧变 (Qiaobian / Ingenious Shift)
 * Passive skill. At the start of any phase (except prepare/end), you may
 * discard 1 hand card to skip that phase (with bonus effects per phase).
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU025_GENERAL_ID = 'WU025' as GeneralId;

export const qiaobian: SkillPlugin = {
  id: 'qiaobian',
  name: '巧变',
  generalId: WU025_GENERAL_ID,
  type: 'passive',
  description: 'Discard 1 hand card to skip a phase (judgment/draw/play/discard), gaining bonus effects.',
  triggers: ['phaseChange'],
  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    const phase = ctx.event.phase;
    return (
      (phase === 'judgment' || phase === 'draw' || phase === 'play' || phase === 'discard') &&
      ctx.player.handCards.length > 0
    );
  },
  activate(ctx) {
    if (ctx.player.handCards.length > 0) {
      ctx.discardCards(ctx.player, [ctx.player.handCards[0]!]);
    }
    ctx.game.activeEffects.push({
      id: `qiaobian-skip-${ctx.game.turnCount}`,
      name: 'qiaobian-skip',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: [ctx.player.id],
      duration: 'phase',
      properties: { skipPhase: true },
    });
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.handCards.length >= 3; },
    selectTargets() { return []; },
  },
};
