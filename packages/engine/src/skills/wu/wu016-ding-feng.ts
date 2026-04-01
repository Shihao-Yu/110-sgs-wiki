/**
 * WU016 丁奉 — 短兵 (Duanbing / Close Combat)
 * Lock skill. When you use 杀 targeting a player at distance 1,
 * you may make them discard an additional card or they take +1 damage.
 *
 * 奋迅 (Fenxun / Rushing)
 * Active skill. Once per turn, discard 1 card to make your distance to a
 * player become 1 until end of turn.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU016_GENERAL_ID = 'WU016' as GeneralId;

export const duanbing: SkillPlugin = {
  id: 'duanbing',
  name: '短兵',
  generalId: WU016_GENERAL_ID,
  type: 'lock',
  description:
    'When your 杀 targets distance-1 player, they must discard 1 card or take +1 damage.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return ctx.event.card.name === 'Slash' || ctx.event.card.name === '杀';
  },
  activate(ctx) {
    if (ctx.event.type !== 'playCard') return;
    const targets = ctx.event.targets ?? [];
    for (const tid of targets) {
      const target = ctx.game.players.find(p => p.id === tid);
      if (!target) continue;
      if (target.handCards.length > 0) {
        ctx.discardCards(target, [target.handCards[0]!]);
      }
    }
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};

export const fenxun: SkillPlugin = {
  id: 'fenxun',
  name: '奋迅',
  generalId: WU016_GENERAL_ID,
  type: 'active',
  description: 'Discard 1 card to set distance to target player to 1 this turn.',
  triggers: ['useSkill'],
  canActivate(ctx) {
    if (ctx.event.type !== 'useSkill') return false;
    return ctx.player.handCards.length > 0 && (ctx.player.marks['fenxun_used'] ?? 0) === 0;
  },
  activate(ctx) {
    if (ctx.event.type !== 'useSkill') return;
    ctx.player.marks['fenxun_used'] = 1;
    if (ctx.player.handCards.length > 0) {
      ctx.discardCards(ctx.player, [ctx.player.handCards[0]!]);
    }
    ctx.game.activeEffects.push({
      id: `fenxun-${ctx.game.turnCount}`,
      name: 'fenxun-close',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: ctx.event.targets ?? [],
      duration: 'turn',
      properties: { distanceOverride: 1 },
    });
  },
  ai: {
    shouldActivate(ctx) { return ctx.player.handCards.length >= 2; },
    selectTargets(_ctx, candidates) { return candidates.slice(0, 1); },
  },
};
