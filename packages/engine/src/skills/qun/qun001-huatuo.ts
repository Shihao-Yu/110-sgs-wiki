/**
 * QUN001 华佗 (Hua Tuo) — 神医
 *
 * 急救 (First Aid / Jijiu): Outside your turn, you may use any red card
 * as a 桃 (Peach) to save a dying player.
 *
 * 青囊 (Medicine / Qingnang): During your play phase, you may discard
 * 1 hand card to recover 1 HP for any player.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN001 = 'QUN001' as GeneralId;

/**
 * 急救 — Use any red card as 桃 outside your turn.
 * Triggers on damage/loseHp events to check for dying players.
 */
export const jijiu: SkillPlugin = {
  id: 'qun_jijiu',
  name: '急救',
  generalId: QUN001,
  type: 'passive',
  description:
    '你的回合外，你可以将一张红色牌当【桃】使用。',
  triggers: ['damage', 'loseHp'],

  canActivate(ctx) {
    // Must not be the current turn player
    const currentPlayer = ctx.game.players[ctx.game.currentPlayerIndex];
    if (currentPlayer?.id === ctx.player.id) return false;

    // Check that the dying player exists (target of damage)
    if (ctx.event.type === 'damage') {
      const target = ctx.game.players.find(p => p.id === ctx.event.target);
      if (!target || target.hp > 0) return false;
    }

    // Must have a red card in hand
    return ctx.player.handCards.some(
      c => c.suit === 'heart' || c.suit === 'diamond',
    );
  },

  activate(ctx) {
    // Find a red card in hand to use as Peach
    const redIdx = ctx.player.handCards.findIndex(
      c => c.suit === 'heart' || c.suit === 'diamond',
    );
    if (redIdx === -1) return;

    const [redCard] = ctx.player.handCards.splice(redIdx, 1);
    ctx.game.discardPile.push(redCard);

    // Recover 1 HP for the dying player
    const targetId =
      ctx.event.type === 'damage' ? ctx.event.target : ctx.event.type === 'loseHp' ? ctx.event.player : null;
    if (!targetId) return;

    const target = ctx.game.players.find(p => p.id === targetId);
    if (target && target.alive) {
      target.hp = Math.min(target.hp + 1, target.maxHp);
    }
  },
};

/**
 * 青囊 — During play phase, discard 1 hand card to heal any player 1 HP.
 */
export const qingnang: SkillPlugin = {
  id: 'qun_qingnang',
  name: '青囊',
  generalId: QUN001,
  type: 'active',
  description:
    '出牌阶段，你可以弃置一张手牌，令一名角色回复1点体力。',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'play') return false;
    if (ctx.player.handCards.length === 0) return false;

    // At least one player must be missing HP
    return ctx.game.players.some(
      p => p.alive && p.hp < p.maxHp,
    );
  },

  activate(ctx) {
    if (ctx.player.handCards.length === 0) return;

    // Discard 1 hand card
    const [discarded] = ctx.player.handCards.splice(0, 1);
    ctx.game.discardPile.push(discarded);

    // Find the most injured alive player and recover 1 HP
    const target = ctx.game.players
      .filter(p => p.alive && p.hp < p.maxHp)
      .sort((a, b) => a.hp - b.hp)[0];

    if (target) {
      target.hp = Math.min(target.hp + 1, target.maxHp);
    }
  },

  ai: {
    shouldActivate(ctx) {
      return (
        ctx.player.handCards.length > 1 &&
        ctx.game.players.some(p => p.alive && p.hp < p.maxHp)
      );
    },
    selectTargets() {
      return [];
    },
  },
};

export const qun001Skills: SkillPlugin[] = [jijiu, qingnang];
