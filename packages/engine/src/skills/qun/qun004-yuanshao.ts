/**
 * QUN004 袁绍 (Yuan Shao) — 高贵的名门
 *
 * 乱击 (Chaos Strike / Luanji): You may use 2 hand cards of the same suit
 * as a 万箭齐发 (Rain of Arrows — targets all other players).
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN004 = 'QUN004' as GeneralId;

/**
 * 乱击 — Use 2 same-suit hand cards as 万箭齐发.
 */
export const luanji: SkillPlugin = {
  id: 'qun_luanji',
  name: '乱击',
  generalId: QUN004,
  type: 'active',
  description:
    '你可以将两张相同花色的手牌当【万箭齐发】使用。',
  triggers: ['playCard'],

  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    if (ctx.event.player !== ctx.player.id) return false;

    // Check for at least 2 cards of the same suit
    const suitCounts: Record<string, number> = {};
    for (const card of ctx.player.handCards) {
      suitCounts[card.suit] = (suitCounts[card.suit] ?? 0) + 1;
      if (suitCounts[card.suit] >= 2) return true;
    }
    return false;
  },

  activate(ctx) {
    // Find 2 cards of the same suit
    const suitCounts: Record<string, number> = {};
    let targetSuit: string | null = null;

    for (const card of ctx.player.handCards) {
      suitCounts[card.suit] = (suitCounts[card.suit] ?? 0) + 1;
      if (suitCounts[card.suit] >= 2 && !targetSuit) {
        targetSuit = card.suit;
      }
    }

    if (!targetSuit) return;

    // Discard 2 cards of the same suit
    const discarded: typeof ctx.player.handCards = [];
    ctx.player.handCards = ctx.player.handCards.filter(card => {
      if (card.suit === targetSuit && discarded.length < 2) {
        discarded.push(card);
        return false;
      }
      return true;
    });

    ctx.game.discardPile.push(...discarded);

    // Apply Rain of Arrows effect to all other alive players
    const targetIds = ctx.game.players
      .filter(p => p.alive && p.id !== ctx.player.id)
      .map(p => p.id);

    ctx.game.activeEffects.push({
      id: `luanji_${ctx.game.turnCount}`,
      name: 'luanji',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: targetIds,
      duration: 'phase',
      properties: { rainOfArrows: true },
    });
  },

  ai: {
    shouldActivate(ctx) {
      const suitCounts: Record<string, number> = {};
      for (const card of ctx.player.handCards) {
        suitCounts[card.suit] = (suitCounts[card.suit] ?? 0) + 1;
        if (suitCounts[card.suit] >= 2) return true;
      }
      return false;
    },
    selectTargets() {
      return [];
    },
  },
};

export const qun004Skills: SkillPlugin[] = [luanji];
