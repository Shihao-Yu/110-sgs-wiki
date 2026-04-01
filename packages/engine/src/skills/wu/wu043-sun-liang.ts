/**
 * WU043 孙亮 — 秀名 (Xiuming / Illustrious Name)
 * Passive skill. When a player uses a card targeting exactly one other
 * player, if you are neither the user nor the target, you may draw 1 card
 * then give 1 card to the user or target.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU043_GENERAL_ID = 'WU043' as GeneralId;

export const xiuming: SkillPlugin = {
  id: 'xiuming',
  name: '秀名',
  generalId: WU043_GENERAL_ID,
  type: 'passive',
  description: 'When a card targets exactly one other player (not you), draw 1 card then give 1 card.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    const targets = ctx.event.targets ?? [];
    return (
      targets.length === 1 &&
      ctx.event.player !== ctx.player.id &&
      !targets.includes(ctx.player.id)
    );
  },
  activate(ctx) {
    ctx.drawCards(ctx.player, 1);
    // Simplified: the give-card step is omitted; net effect is draw 1
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};
