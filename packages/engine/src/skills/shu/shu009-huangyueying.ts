/**
 * SHU009 黄月英 (Huang Yueying)
 *
 * 集智 (Jizhi / Wisdom): When you use a non-delayed trick card, draw 1 card.
 *
 * 奇才 (Qicai / Genius): You have no distance limit on trick cards.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const SHU009 = 'SHU009' as GeneralId;

/**
 * Delayed trick cards in the standard game:
 * 乐不思蜀 (Contentment), 兵粮寸断 (Supply Shortage), 闪电 (Lightning)
 */
const DELAYED_TRICKS = new Set(['乐不思蜀', '兵粮寸断', '闪电']);

/**
 * 集智 — After using a non-delayed trick, draw 1 card.
 */
export const jizhi: SkillPlugin = {
  id: 'jizhi',
  name: '集智',
  generalId: SHU009,
  type: 'passive',
  description:
    'When you use a non-delayed trick card, draw 1 card.',
  triggers: ['playCard'],

  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    if (ctx.event.player !== ctx.player.id) return false;
    const card = ctx.event.card;
    if (!card || card.type !== 'trick') return false;
    return !DELAYED_TRICKS.has(card.name);
  },

  activate(ctx) {
    ctx.drawCards(ctx.player, 1);
  },
};

/**
 * 奇才 — No distance limit on trick cards.
 * Implemented as a permanent active effect the target-validation
 * layer can inspect.
 */
export const qicai: SkillPlugin = {
  id: 'qicai',
  name: '奇才',
  generalId: SHU009,
  type: 'lock',
  description:
    'You have no distance limit on trick cards.',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    return ctx.event.type === 'phaseChange' && ctx.event.phase === 'prepare';
  },

  activate(ctx) {
    // Remove stale effects
    ctx.game.activeEffects = ctx.game.activeEffects.filter(
      (e) => !(e.name === 'qicai' && e.sourcePlayerId === ctx.player.id),
    );

    ctx.game.activeEffects.push({
      id: `qicai_${ctx.player.id}`,
      name: 'qicai',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: [ctx.player.id],
      duration: 'permanent',
      properties: { noTrickDistanceLimit: true },
    });
  },
};

export const shu009Skills: SkillPlugin[] = [jizhi, qicai];
