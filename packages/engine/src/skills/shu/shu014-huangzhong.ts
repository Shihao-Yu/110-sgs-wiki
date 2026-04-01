/**
 * SHU014 徐庶 (Xu Shu)
 *
 * 无言 (Wuyan / Wordless): Trick card damage you deal or receive is
 * prevented.
 *
 * 举荐 (Jujian / Recommend): During discard phase, you may give your
 * discarded cards to another player.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const SHU014 = 'SHU014' as GeneralId;

export const wuyan: SkillPlugin = {
  id: 'wuyan',
  name: '无言',
  generalId: SHU014,
  type: 'lock',
  description: 'Trick card damage you deal or receive is prevented.',
  triggers: ['damage'],

  canActivate(ctx) {
    if (ctx.event.type !== 'damage') return false;
    // Trick-based damage — simplified check via effect markers
    const isTrickDamage = ctx.game.activeEffects.some(
      (e) => e.properties['trickDamage'] === true,
    );
    if (!isTrickDamage) return false;
    return (
      ctx.event.source === ctx.player.id ||
      ctx.event.target === ctx.player.id
    );
  },

  activate(ctx) {
    // Prevent the damage by pushing a nullify effect
    ctx.game.activeEffects.push({
      id: `wuyan_${ctx.player.id}_${ctx.game.turnCount}`,
      name: 'wuyan',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: [ctx.player.id],
      duration: 'phase',
      properties: { preventTrickDamage: true },
    });
  },
};

export const jujian: SkillPlugin = {
  id: 'jujian',
  name: '举荐',
  generalId: SHU014,
  type: 'active',
  description:
    'During discard phase, you may give your discarded cards to another player.',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    return ctx.event.phase === 'discard' && ctx.player.handCards.length > 0;
  },

  activate(ctx) {
    const target = ctx.game.players.find(
      (p) => p.alive && p.id !== ctx.player.id,
    );
    if (!target) return;

    ctx.game.activeEffects.push({
      id: `jujian_${ctx.player.id}`,
      name: 'jujian',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: [target.id],
      duration: 'phase',
      properties: { giveDiscards: true },
    });
  },
};

export const shu014Skills: SkillPlugin[] = [wuyan, jujian];
