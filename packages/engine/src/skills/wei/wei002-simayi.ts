/**
 * WEI002 司马懿 (Sima Yi) — 狼顾之鬼
 *
 * 反馈 (Feedback / Fankui): After you take damage, you may take one card
 * from the damage source's hand or equipment area.
 *
 * 鬼才 (Devil Genius / Guicai): Before any player's judgment card takes
 * effect, you may play a hand card to replace it.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

/**
 * 反馈 — After taking damage, acquire one card from the source player.
 */
export const fankui: SkillPlugin = {
  id: 'skill_fankui',
  name: '反馈',
  generalId: 'general_simayi' as GeneralId,
  type: 'passive',
  description: '当你受到伤害后，你可以获得伤害来源的一张牌。',
  triggers: ['damage'],

  canActivate(ctx) {
    if (ctx.event.type !== 'damage') return false;
    if (ctx.event.target !== ctx.player.id) return false;
    if (ctx.event.source == null) return false;
    // Source must have cards to take
    const source = ctx.game.players.find(p => p.id === ctx.event.type && false);
    // Simplified: just check source exists
    return ctx.event.source !== ctx.player.id;
  },

  activate(ctx) {
    if (ctx.event.type !== 'damage' || !ctx.event.source) return;
    const source = ctx.game.players.find(p => p.id === ctx.event.source);
    if (!source || source.handCards.length === 0) return;

    // Take the first hand card from source (AI/UI would select)
    const stolen = source.handCards.splice(0, 1);
    ctx.player.handCards.push(...stolen);
  },
};

/**
 * 鬼才 — Replace any judgment card with a hand card.
 * Judgment events are not yet in the GameEvent union, so this is a
 * forward-looking registration that triggers on phaseChange (judgment phase).
 */
export const guicai: SkillPlugin = {
  id: 'skill_guicai',
  name: '鬼才',
  generalId: 'general_simayi' as GeneralId,
  type: 'passive',
  description: '当一名角色的判定牌生效前，你可以打出一张手牌代替之。',
  triggers: ['phaseChange'],

  // TODO: Requires judgment sub-event system
  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    // Would check for judgment phase and available hand cards
    return false;
  },

  activate() {
    /* Awaiting judgment event infrastructure */
  },
};

export const wei002Skills: SkillPlugin[] = [fankui, guicai];
