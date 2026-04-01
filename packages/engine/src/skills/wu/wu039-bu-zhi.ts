/**
 * WU039 步骘 — 举荐 (Jujian / Recommend)
 * Active skill. During your play phase, you may discard up to 3 non-basic
 * cards. For each card discarded, a target draws 1 card. If you discarded
 * 3 cards, the target also recovers 1 HP.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU039_GENERAL_ID = 'WU039' as GeneralId;

export const jujian: SkillPlugin = {
  id: 'jujian',
  name: '举荐',
  generalId: WU039_GENERAL_ID,
  type: 'active',
  description: 'Discard up to 3 non-basic cards; target draws that many. If 3, also recover 1 HP.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return ctx.player.handCards.some(c => c.type !== 'basic');
  },
  activate(ctx) {
    if (ctx.event.type !== 'playCard') return;
    const nonBasic = ctx.player.handCards.filter(c => c.type !== 'basic');
    const toDiscard = nonBasic.slice(0, 3);
    if (toDiscard.length === 0) return;
    ctx.discardCards(ctx.player, toDiscard);
    const targets = ctx.event.targets ?? [];
    const target = ctx.game.players.find(p => targets.includes(p.id));
    if (target) {
      ctx.drawCards(target, toDiscard.length);
      if (toDiscard.length === 3 && target.hp < target.maxHp) {
        target.hp += 1;
      }
    }
  },
  ai: {
    shouldActivate(ctx) {
      return ctx.player.handCards.filter(c => c.type !== 'basic').length >= 2;
    },
    selectTargets(_ctx, candidates) { return candidates.slice(0, 1); },
  },
};
