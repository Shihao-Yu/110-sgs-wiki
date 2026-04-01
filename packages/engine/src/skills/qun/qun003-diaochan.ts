/**
 * QUN003 貂蝉 (Diao Chan) — 绝世舞姬
 *
 * 离间 (Sow Discord / Lijian): During your play phase, discard 1 card and
 * choose 2 male characters — they must duel each other (the second target
 * is the source of the duel against the first target).
 *
 * 闭月 (Eclipse / Biyue): At the end of your turn, draw 1 card.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN003 = 'QUN003' as GeneralId;

/**
 * 离间 — Discard 1 card to force 2 male characters to duel.
 */
export const lijian: SkillPlugin = {
  id: 'qun_lijian',
  name: '离间',
  generalId: QUN003,
  type: 'active',
  description:
    '出牌阶段限一次，你可以弃置一张牌并选择两名男性角色，令其中一名男性角色视为对另一名男性角色使用一张【决斗】。',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'play') return false;
    if (ctx.player.handCards.length === 0) return false;

    // Need at least 2 other alive players to target
    const otherAlive = ctx.game.players.filter(
      p => p.alive && p.id !== ctx.player.id,
    );
    return otherAlive.length >= 2;
  },

  activate(ctx) {
    if (ctx.player.handCards.length === 0) return;

    // Discard 1 card
    const [discarded] = ctx.player.handCards.splice(0, 1);
    ctx.game.discardPile.push(discarded);

    // Select first 2 other alive players as duel targets
    const targets = ctx.game.players
      .filter(p => p.alive && p.id !== ctx.player.id)
      .slice(0, 2);

    if (targets.length < 2) return;

    // Create a duel effect between them
    ctx.game.activeEffects.push({
      id: `lijian_${ctx.game.turnCount}`,
      name: 'lijian',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: [targets[0].id, targets[1].id],
      duration: 'phase',
      properties: { forcedDuel: true },
    });
  },
};

/**
 * 闭月 — Draw 1 card at end phase.
 */
export const biyue: SkillPlugin = {
  id: 'qun_biyue',
  name: '闭月',
  generalId: QUN003,
  type: 'passive',
  description: '结束阶段，你可以摸一张牌。',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'end') return false;
    return ctx.event.player === ctx.player.id;
  },

  activate(ctx) {
    ctx.drawCards(ctx.player, 1);
  },
};

export const qun003Skills: SkillPlugin[] = [lijian, biyue];
