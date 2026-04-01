/**
 * WEI006 郭嘉 (Guo Jia) — 早终的先知
 *
 * 天妒 (Envy of Heaven / Tiandu): After your judgment card takes effect,
 * you may take the judgment card.
 *
 * 遗计 (Last Plan / Yiji): After you take 1 damage, you may draw 2 cards,
 * then give up to 2 hand cards to any player(s).
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

/**
 * 天妒 — Acquire your own judgment cards after they resolve.
 * Requires judgment sub-events; registered on phaseChange for now.
 */
export const tiandu: SkillPlugin = {
  id: 'skill_tiandu',
  name: '天妒',
  generalId: 'general_guojia' as GeneralId,
  type: 'passive',
  description: '当你的判定牌生效后，你可以获得此判定牌。',
  triggers: ['phaseChange'],

  // TODO: Requires judgment resolution events
  canActivate: () => false,

  activate() {
    /* Awaiting judgment event infrastructure */
  },
};

/**
 * 遗计 — After taking damage, draw 2 then distribute 2 cards.
 */
export const yiji: SkillPlugin = {
  id: 'skill_yiji',
  name: '遗计',
  generalId: 'general_guojia' as GeneralId,
  type: 'passive',
  description:
    '当你受到1点伤害后，你可以摸两张牌，然后将至多两张手牌交给任意角色。',
  triggers: ['damage'],

  canActivate(ctx) {
    if (ctx.event.type !== 'damage') return false;
    return ctx.event.target === ctx.player.id;
  },

  activate(ctx) {
    // Draw 2 cards
    ctx.drawCards(ctx.player, 2);

    // In full implementation, the player would select up to 2 cards
    // and target player(s) to give them to. For now, the cards stay
    // in hand until the UI/AI selection layer is integrated.
  },
};

export const wei006Skills: SkillPlugin[] = [tiandu, yiji];
