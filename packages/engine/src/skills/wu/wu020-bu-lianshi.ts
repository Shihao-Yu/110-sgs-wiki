/**
 * WU020 步练师 — 安恤 (Anxu / Consolation)
 * Active skill (once per turn). Select 2 players with different hand card counts.
 * The one with more gives 1 card to the other. If you are not one of them, draw 1.
 *
 * 追忆 (Zhuiyi / Remembrance)
 * Passive skill. When you die, a player (not the killer) draws 3 and recovers 1 HP.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU020_GENERAL_ID = 'WU020' as GeneralId;

export const anxu: SkillPlugin = {
  id: 'anxu',
  name: '安恤',
  generalId: WU020_GENERAL_ID,
  type: 'active',
  description: 'Select 2 players with different hand counts. The richer gives 1 card to the poorer. If not involved, draw 1.',
  triggers: ['useSkill'],
  canActivate(ctx) {
    if (ctx.event.type !== 'useSkill') return false;
    return (ctx.player.marks['anxu_used'] ?? 0) === 0;
  },
  activate(ctx) {
    ctx.player.marks['anxu_used'] = 1;
    if (ctx.event.type !== 'useSkill') return;
    const targets = ctx.event.targets ?? [];
    if (targets.length < 2) return;
    const p1 = ctx.game.players.find(p => p.id === targets[0]);
    const p2 = ctx.game.players.find(p => p.id === targets[1]);
    if (!p1 || !p2) return;
    const [richer, poorer] = p1.handCards.length >= p2.handCards.length ? [p1, p2] : [p2, p1];
    if (richer.handCards.length > 0) {
      const card = richer.handCards.shift()!;
      poorer.handCards.push(card);
    }
    if (!targets.includes(ctx.player.id)) {
      ctx.drawCards(ctx.player, 1);
    }
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets(_ctx, candidates) { return candidates.slice(0, 2); },
  },
};

export const zhuiyi: SkillPlugin = {
  id: 'zhuiyi',
  name: '追忆',
  generalId: WU020_GENERAL_ID,
  type: 'passive',
  description: 'When you die, a player (not the killer) draws 3 and recovers 1 HP.',
  triggers: ['death'],
  canActivate(ctx) {
    if (ctx.event.type !== 'death') return false;
    return ctx.event.player === ctx.player.id;
  },
  activate(ctx) {
    if (ctx.event.type !== 'death') return;
    const beneficiary = ctx.game.players.find(
      p => p.id !== ctx.player.id && p.id !== ctx.event.killer && p.alive,
    );
    if (!beneficiary) return;
    ctx.drawCards(beneficiary, 3);
    if (beneficiary.hp < beneficiary.maxHp) {
      beneficiary.hp += 1;
    }
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};
