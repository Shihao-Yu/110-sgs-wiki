/**
 * WU046 朱治 (alternate) — 巧变 (Qiaobian Alt / Clever Shift)
 * Alternate version. Active skill. Once per turn, you may skip a phase to
 * perform an alternate action (simplified).
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU046_GENERAL_ID = 'WU046' as GeneralId;

export const qiaobianAlt: SkillPlugin = {
  id: 'qiaobian_alt',
  name: '巧变',
  generalId: WU046_GENERAL_ID,
  type: 'active',
  description: 'Alternate Zhu Zhi — skip a phase to perform a substitute action.',
  triggers: ['phaseChange'],
  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    return (
      ctx.event.player === ctx.player.id &&
      (ctx.player.marks['qiaobian_alt_used'] ?? 0) === 0
    );
  },
  activate(ctx) {
    ctx.player.marks['qiaobian_alt_used'] = 1;
    // Simplified: draw 1 card as compensation for skipping a phase
    ctx.drawCards(ctx.player, 1);
  },
  ai: {
    shouldActivate() { return false; },
    selectTargets() { return []; },
  },
};
