/**
 * WEI010 曹仁 (Cao Ren) — 大将军
 *
 * 据守 (Entrench / Jushou): During your end phase, you may draw 3 cards,
 * then flip your character card face-down (skip next turn).
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

export const jushou: SkillPlugin = {
  id: 'skill_jushou',
  name: '据守',
  generalId: 'general_caoren' as GeneralId,
  type: 'passive',
  description: '结束阶段，你可以摸三张牌，然后翻面。',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'end') return false;
    return ctx.event.player === ctx.player.id;
  },

  activate(ctx) {
    ctx.drawCards(ctx.player, 3);
    // Mark as flipped — the turn system would skip the next turn
    ctx.player.marks['flipped'] = 1;
  },
};

export const wei010Skills: SkillPlugin[] = [jushou];
