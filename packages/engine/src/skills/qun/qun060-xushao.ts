/**
 * QUN060 许劭 (Xu Shao) — 月旦评
 *
 * 品评 (Appraisal / Pinping): At the start of your turn, you may
 * look at the top 3 cards of the draw pile and rearrange them.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN060 = 'QUN060' as GeneralId;

/**
 * 品评 — Look at top 3 cards and rearrange (simplified: move strongest to top).
 */
export const pinping: SkillPlugin = {
  id: 'qun_pinping',
  name: '品评',
  generalId: QUN060,
  type: 'active',
  description: '准备阶段，你可以观看牌堆顶的三张牌并以任意顺序放回。',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'prepare') return false;
    return ctx.game.drawPile.length >= 3;
  },

  activate(ctx) {
    // Peek at top 3 cards and sort by number descending (highest first)
    const top3 = ctx.game.drawPile.splice(0, 3);
    top3.sort((a, b) => b.number - a.number);
    ctx.game.drawPile.unshift(...top3);
  },
};

export const qun060Skills: SkillPlugin[] = [pinping];
