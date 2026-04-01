/**
 * WEI007 甄姬 (Zhen Ji) — 薄幸的美人
 *
 * 洛神 (Goddess / Luoshen): During your prepare phase, you may judge
 * repeatedly — as long as the result is black (spade/club), take the
 * judgment card and continue; stop on red.
 *
 * 倾国 (Allure / Qingguo): You may use a black hand card as a 闪 (Dodge).
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

/**
 * 洛神 — Flip cards during prepare phase; keep all black cards.
 */
export const luoshen: SkillPlugin = {
  id: 'skill_luoshen',
  name: '洛神',
  generalId: 'general_zhenji' as GeneralId,
  type: 'passive',
  description:
    '准备阶段，你可以进行判定：若为黑色，你获得此判定牌并可以继续判定。',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'prepare') return false;
    if (ctx.event.player !== ctx.player.id) return false;
    return ctx.game.drawPile.length > 0;
  },

  activate(ctx) {
    // Keep flipping cards until we get a non-black or run out
    while (ctx.game.drawPile.length > 0) {
      const card = ctx.game.drawPile.shift()!;
      const isBlack = card.suit === 'spade' || card.suit === 'club';

      if (isBlack) {
        // Take the black judgment card
        ctx.player.handCards.push(card);
      } else {
        // Red card — stop and discard
        ctx.game.discardPile.push(card);
        break;
      }
    }
  },
};

/**
 * 倾国 — Use any black hand card as a Dodge (闪).
 * This is a card-conversion skill triggered on response windows.
 */
export const qingguo: SkillPlugin = {
  id: 'skill_qingguo',
  name: '倾国',
  generalId: 'general_zhenji' as GeneralId,
  type: 'active',
  description: '你可以将一张黑色手牌当【闪】使用或打出。',
  triggers: ['response'],

  canActivate(ctx) {
    if (ctx.event.type !== 'response') return false;
    // Must have a black hand card available
    return ctx.player.handCards.some(
      c => c.suit === 'spade' || c.suit === 'club',
    );
  },

  activate(ctx) {
    // Find the first black card and treat it as a Dodge
    const idx = ctx.player.handCards.findIndex(
      c => c.suit === 'spade' || c.suit === 'club',
    );
    if (idx === -1) return;

    const [card] = ctx.player.handCards.splice(idx, 1);
    ctx.game.discardPile.push(card);
    // The response handler would register this as a valid Dodge
  },
};

export const wei007Skills: SkillPlugin[] = [luoshen, qingguo];
