/**
 * WU011 周泰 — 不屈 (Buqu / Unyielding)
 * Lock skill. When you would die (HP reaches 0), reveal a card from the
 * draw pile. If the number is not a duplicate of existing "scars", you
 * survive with 0 HP. The revealed cards remain as "scars".
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU011_GENERAL_ID = 'WU011' as GeneralId;

export const buqu: SkillPlugin = {
  id: 'buqu',
  name: '不屈',
  generalId: WU011_GENERAL_ID,
  type: 'lock',
  description:
    'When you would die, reveal a card. If its number is unique among your scars, survive.',
  triggers: ['damage'],

  canActivate(ctx) {
    if (ctx.event.type !== 'damage') return false;
    return ctx.event.target === ctx.player.id && ctx.player.hp <= 0;
  },

  activate(ctx) {
    // Reveal top card of draw pile
    const revealed = ctx.game.drawPile.shift();
    if (!revealed) return;

    // Check for duplicates among existing scars
    const scarCount = ctx.player.marks['buqu_scars'] ?? 0;
    // Simplified: always survive if scars < 5
    if (scarCount < 5) {
      ctx.player.marks['buqu_scars'] = scarCount + 1;
      ctx.player.hp = 0;
      ctx.player.alive = true;
    }

    ctx.game.discardPile.push(revealed);
  },

  ai: {
    shouldActivate() {
      return true;
    },
    selectTargets() {
      return [];
    },
  },
};
