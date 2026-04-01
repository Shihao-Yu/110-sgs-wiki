/**
 * WU034 蒋钦 — 尚义 (Shangyi / Upholding Righteousness)
 * Active skill. Once per turn during your play phase, you may show your
 * hand to a target player. If you have no duplicated suit with their hand,
 * you may discard one of their cards.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU034_GENERAL_ID = 'WU034' as GeneralId;

export const shangyi: SkillPlugin = {
  id: 'shangyi',
  name: '尚义',
  generalId: WU034_GENERAL_ID,
  type: 'active',
  description: 'Once per turn, show your hand; if no shared suits with target, discard one of their cards.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return (ctx.player.marks['shangyi_used'] ?? 0) === 0;
  },
  activate(ctx) {
    if (ctx.event.type !== 'playCard') return;
    ctx.player.marks['shangyi_used'] = 1;
    const targets = ctx.event.targets ?? [];
    for (const tid of targets) {
      const target = ctx.game.players.find(p => p.id === tid);
      if (target && target.handCards.length > 0) {
        ctx.discardCards(target, [target.handCards[0]!]);
      }
    }
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets(_ctx, candidates) { return candidates.slice(0, 1); },
  },
};
