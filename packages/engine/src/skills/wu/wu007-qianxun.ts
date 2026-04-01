/**
 * WU007 陆逊 — 谦逊 (Qianxun / Modesty)
 * Lock skill. You cannot be targeted by 顺手牵羊 (Snatch) or 乐不思蜀 (Indulgence).
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU007_GENERAL_ID = 'WU007' as GeneralId;

const BLOCKED_CARDS = new Set(['顺手牵羊', 'Snatch', '乐不思蜀', 'Indulgence']);

export const qianxun: SkillPlugin = {
  id: 'qianxun',
  name: '谦逊',
  generalId: WU007_GENERAL_ID,
  type: 'lock',
  description: 'You cannot be targeted by 顺手牵羊 (Snatch) or 乐不思蜀 (Indulgence).',
  triggers: ['playCard'],

  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    if (!BLOCKED_CARDS.has(ctx.event.card.name)) return false;
    // Check if this player is in the target list
    return (ctx.event.targets ?? []).includes(ctx.player.id);
  },

  activate(ctx) {
    if (ctx.event.type !== 'playCard') return;
    // Remove this player from target list — the card has no effect on them
    if (ctx.event.targets) {
      const idx = ctx.event.targets.indexOf(ctx.player.id);
      if (idx !== -1) {
        ctx.event.targets.splice(idx, 1);
      }
    }
  },

  ai: {
    shouldActivate() {
      return true; // Lock skill
    },
    selectTargets() {
      return [];
    },
  },
};
