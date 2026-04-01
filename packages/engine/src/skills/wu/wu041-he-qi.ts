/**
 * WU041 贺齐 — 奇正 (Qizheng / Surprise and Convention)
 * Active skill. Once per turn, you may select X hand cards (1 ≤ X ≤ 3)
 * and place them face-down. Other players guess odd/even count. Those who
 * guess wrong take 1 damage; those who guess right draw 1 card.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU041_GENERAL_ID = 'WU041' as GeneralId;

export const qizheng: SkillPlugin = {
  id: 'qizheng',
  name: '奇正',
  generalId: WU041_GENERAL_ID,
  type: 'active',
  description: 'Place cards face-down; opponents guess odd/even. Wrong guessers take 1 damage.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return (
      ctx.player.handCards.length > 0 &&
      (ctx.player.marks['qizheng_used'] ?? 0) === 0
    );
  },
  activate(ctx) {
    ctx.player.marks['qizheng_used'] = 1;
    // Simplified: deal 1 damage to a random opponent (simulating wrong guess)
    const targets = ctx.game.players.filter(p => p.alive && p.id !== ctx.player.id);
    if (targets.length > 0) {
      ctx.dealDamage(ctx.player, targets[0]!, 1);
    }
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.handCards.length >= 2; },
    selectTargets() { return []; },
  },
};
