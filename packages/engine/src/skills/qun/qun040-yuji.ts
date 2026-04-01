/**
 * QUN040 虞姬 (Yu Ji) — 虞美人
 *
 * 倾国 (Alluring Country / Qingguo): You may use a black hand card as
 * 闪 (Dodge).
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN040 = 'QUN040' as GeneralId;

/**
 * 倾国 — Use a black hand card as 闪 (Dodge).
 */
export const qingguo: SkillPlugin = {
  id: 'qun_qingguo',
  name: '倾国',
  generalId: QUN040,
  type: 'passive',
  description: '你可以将一张黑色手牌当【闪】使用或打出。',
  triggers: ['response'],

  canActivate(ctx) {
    if (ctx.event.type !== 'response') return false;
    // Must have a black card in hand
    return ctx.player.handCards.some(
      c => c.suit === 'spade' || c.suit === 'club',
    );
  },

  activate(ctx) {
    const blackIdx = ctx.player.handCards.findIndex(
      c => c.suit === 'spade' || c.suit === 'club',
    );
    if (blackIdx === -1) return;

    const [blackCard] = ctx.player.handCards.splice(blackIdx, 1);
    ctx.game.discardPile.push(blackCard);

    // Mark response as accepted (dodge provided)
    if (ctx.event.type === 'response') {
      ctx.event.accepted = true;
    }
  },
};

export const qun040Skills: SkillPlugin[] = [qingguo];
