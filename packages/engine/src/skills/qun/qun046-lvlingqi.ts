/**
 * QUN046 吕玲绮 (Lv Ling Qi) — 女中豪杰
 *
 * 竭力 (Exhaust / Jieli): During your play phase, you may discard 1
 * equipment card to use an extra 杀 (Slash) this turn.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN046 = 'QUN046' as GeneralId;

/**
 * 竭力 — Discard 1 equipment card to gain an extra slash this turn.
 * Simplified: creates an activeEffect granting extra slash usage.
 */
export const jieli: SkillPlugin = {
  id: 'qun_jieli',
  name: '竭力',
  generalId: QUN046,
  type: 'active',
  description: '出牌阶段，你可以弃置一张装备牌，视为使用一张【杀】。',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'play') return false;
    // Need at least 1 equipment card in hand
    return ctx.player.handCards.some(c => c.type === 'equipment');
  },

  activate(ctx) {
    const equipIdx = ctx.player.handCards.findIndex(
      c => c.type === 'equipment',
    );
    if (equipIdx === -1) return;

    const [equipCard] = ctx.player.handCards.splice(equipIdx, 1);
    ctx.game.discardPile.push(equipCard);

    // Grant extra slash effect
    ctx.game.activeEffects.push({
      id: `jieli_${ctx.game.turnCount}`,
      name: 'jieli',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: [ctx.player.id],
      duration: 'turn',
      properties: { extraSlash: true },
    });
  },
};

export const qun046Skills: SkillPlugin[] = [jieli];
