/**
 * WU010 太史慈 — 天义 (Tianyi / Heaven's Righteousness)
 * Active skill (once per turn). Perform a point fight with another player.
 * If you win: your 杀 has no range limit, no target limit, and +1 target this turn.
 * If you lose: you cannot use 杀 this turn.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU010_GENERAL_ID = 'WU010' as GeneralId;

export const tianyi: SkillPlugin = {
  id: 'tianyi',
  name: '天义',
  generalId: WU010_GENERAL_ID,
  type: 'active',
  description:
    'Point fight with another player. Win: 杀 gets unlimited range/targets. Lose: cannot use 杀 this turn.',
  triggers: ['useSkill'],

  canActivate(ctx) {
    if (ctx.event.type !== 'useSkill') return false;
    return (
      ctx.player.handCards.length > 0 &&
      (ctx.player.marks['tianyi_used'] ?? 0) === 0
    );
  },

  activate(ctx) {
    ctx.player.marks['tianyi_used'] = 1;

    if (ctx.event.type !== 'useSkill') return;
    const targets = ctx.event.targets ?? [];
    if (targets.length === 0) return;

    const targetPlayer = ctx.game.players.find(p => p.id === targets[0]);
    if (!targetPlayer || targetPlayer.handCards.length === 0) return;

    // Simplified point fight: compare first hand card numbers
    const myCard = ctx.player.handCards[0]!;
    const theirCard = targetPlayer.handCards[0]!;

    if (myCard.number > theirCard.number) {
      // Win: grant bonus effect
      ctx.game.activeEffects.push({
        id: `tianyi-bonus-${ctx.game.turnCount}`,
        name: 'tianyi-bonus',
        sourcePlayerId: ctx.player.id,
        targetPlayerIds: [ctx.player.id],
        duration: 'turn',
        properties: { unlimitedSlash: true },
      });
    } else {
      // Lose: cannot use Slash this turn
      ctx.game.activeEffects.push({
        id: `tianyi-penalty-${ctx.game.turnCount}`,
        name: 'tianyi-penalty',
        sourcePlayerId: ctx.player.id,
        targetPlayerIds: [ctx.player.id],
        duration: 'turn',
        properties: { noSlash: true },
      });
    }
  },

  ai: {
    shouldActivate(ctx) {
      return ctx.player.handCards.length >= 3;
    },
    selectTargets(_ctx, candidates) {
      return candidates.slice(0, 1);
    },
  },
};
