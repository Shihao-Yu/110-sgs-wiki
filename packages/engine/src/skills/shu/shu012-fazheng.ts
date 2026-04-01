/**
 * SHU012 法正 (Fa Zheng)
 *
 * 恩怨 (Enyuan / Gratitude & Grudge):
 * - When another player gives you a card or recovers your HP, that player draws 1 card.
 * - When you take damage, the damage source must give you 1 hand card or lose 1 HP.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const SHU012 = 'SHU012' as GeneralId;

/**
 * 恩怨 (Gratitude half) — When you recover HP, the source draws 1 card.
 */
export const enyuanGratitude: SkillPlugin = {
  id: 'enyuan_gratitude',
  name: '恩怨·恩',
  generalId: SHU012,
  type: 'passive',
  description:
    'When another player gives you a card or recovers your HP, they draw 1 card.',
  triggers: ['recover'],

  canActivate(ctx) {
    if (ctx.event.type !== 'recover') return false;
    // The recovery target must be this player
    return ctx.event.target === ctx.player.id;
  },

  activate(ctx) {
    if (ctx.event.type !== 'recover') return;

    // In a full implementation, we would track who caused the recovery.
    // For now, push an effect that signals gratitude was triggered.
    ctx.game.activeEffects.push({
      id: `enyuan_gratitude_${ctx.player.id}_${ctx.game.turnCount}`,
      name: 'enyuan_gratitude',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: [ctx.player.id],
      duration: 'phase',
      properties: { gratitudeTriggered: true },
    });
  },
};

/**
 * 恩怨 (Grudge half) — When you take damage, source must give you 1 hand
 * card or lose 1 HP.
 */
export const enyuanGrudge: SkillPlugin = {
  id: 'enyuan_grudge',
  name: '恩怨·怨',
  generalId: SHU012,
  type: 'passive',
  description:
    'When you take damage, the damage source must give you 1 hand card or lose 1 HP.',
  triggers: ['damage'],

  canActivate(ctx) {
    if (ctx.event.type !== 'damage') return false;
    if (ctx.event.target !== ctx.player.id) return false;
    // Must have a damage source (not environment damage)
    if (ctx.event.source == null) return false;
    return ctx.event.source !== ctx.player.id;
  },

  activate(ctx) {
    if (ctx.event.type !== 'damage' || !ctx.event.source) return;

    const source = ctx.game.players.find((p) => p.id === ctx.event.source);
    if (!source || !source.alive) return;

    if (source.handCards.length > 0) {
      // Source gives 1 hand card to Fa Zheng (default: first card)
      const givenCard = source.handCards.splice(0, 1);
      ctx.player.handCards.push(...givenCard);
    } else {
      // Source has no hand cards — lose 1 HP
      source.hp -= 1;
    }
  },
};

export const shu012Skills: SkillPlugin[] = [enyuanGratitude, enyuanGrudge];
