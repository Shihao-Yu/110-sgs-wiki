/**
 * WU005 周瑜 — 英姿 (Yingzi / Handsome)
 * Lock skill. During your draw phase, you draw 1 additional card (3 total).
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU005_GENERAL_ID = 'WU005' as GeneralId;

export const yingzi: SkillPlugin = {
  id: 'yingzi',
  name: '英姿',
  generalId: WU005_GENERAL_ID,
  type: 'lock',
  description: 'During your draw phase, you draw 1 additional card.',
  triggers: ['drawCards'],

  canActivate(ctx) {
    if (ctx.event.type !== 'drawCards') return false;
    // Activate only for the skill owner's normal draw
    return ctx.event.player === ctx.player.id;
  },

  activate(ctx) {
    // Draw 1 extra card
    ctx.drawCards(ctx.player, 1);
  },

  ai: {
    shouldActivate() {
      return true; // Lock skill, always active
    },
    selectTargets() {
      return [];
    },
  },
};
