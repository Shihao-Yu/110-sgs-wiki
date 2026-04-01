/**
 * WU003 吕蒙 — 克己 (Keji / Self-discipline)
 * Lock skill. If you did not use 杀 (Slash) during your play phase,
 * you skip your discard phase.
 *
 * Implementation: triggers on phaseChange to 'discard'. The skill checks
 * whether the player used a Slash during their play phase (tracked via marks).
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU003_GENERAL_ID = 'WU003' as GeneralId;

export const keji: SkillPlugin = {
  id: 'keji',
  name: '克己',
  generalId: WU003_GENERAL_ID,
  type: 'lock',
  description:
    'If you did not use 杀 (Slash) during your play phase, you skip your discard phase.',
  triggers: ['phaseChange', 'playCard'],

  canActivate(ctx) {
    if (ctx.event.type === 'playCard') {
      // Track slash usage via marks
      return ctx.event.card.name === 'Slash' || ctx.event.card.name === '杀';
    }
    if (ctx.event.type === 'phaseChange' && ctx.event.phase === 'discard') {
      // Activate (skip discard) only if no slash was used
      return (ctx.player.marks['keji_slash_used'] ?? 0) === 0;
    }
    return false;
  },

  activate(ctx) {
    if (ctx.event.type === 'playCard') {
      // Mark that a slash was used this turn
      ctx.player.marks['keji_slash_used'] = 1;
      return;
    }

    if (ctx.event.type === 'phaseChange' && ctx.event.phase === 'discard') {
      // Skip discard phase — player keeps all hand cards
      // The phase manager will handle the skip; we add an active effect
      ctx.game.activeEffects.push({
        id: `keji-skip-discard-${ctx.game.turnCount}`,
        name: 'keji-skip-discard',
        sourcePlayerId: ctx.player.id,
        targetPlayerIds: [ctx.player.id],
        duration: 'phase',
        properties: { skipDiscard: true },
      });
    }
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
