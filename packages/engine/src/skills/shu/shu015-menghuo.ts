/**
 * SHU015 孟获 (Meng Huo)
 *
 * 祸首 (Huoshou / Ringleader): Lock. 南蛮入侵 has no effect on you;
 * when 南蛮入侵 deals damage, the source is you instead.
 *
 * 再起 (Zaiqi / Resurgence): During draw phase, you may forgo drawing
 * and instead flip X cards from the draw pile (X = damage taken). For each
 * heart, recover 1 HP; put the rest in your hand.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const SHU015 = 'SHU015' as GeneralId;

export const huoshou: SkillPlugin = {
  id: 'huoshou',
  name: '祸首',
  generalId: SHU015,
  type: 'lock',
  description:
    '南蛮入侵 has no effect on you; when it deals damage, you are the source.',
  triggers: ['playCard'],

  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return ctx.event.card?.name === '南蛮入侵';
  },

  activate(ctx) {
    ctx.game.activeEffects.push({
      id: `huoshou_${ctx.player.id}`,
      name: 'huoshou',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: [ctx.player.id],
      duration: 'phase',
      properties: { immuneToNanman: true, nanmanSource: ctx.player.id as string },
    });
  },
};

export const zaiqi: SkillPlugin = {
  id: 'zaiqi',
  name: '再起',
  generalId: SHU015,
  type: 'active',
  description:
    'During draw phase, flip cards equal to damage taken; hearts recover HP, rest go to hand.',
  triggers: ['phaseChange'],

  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'draw') return false;
    return ctx.player.hp < ctx.player.maxHp;
  },

  activate(ctx) {
    const damageTaken = ctx.player.maxHp - ctx.player.hp;
    const flipCount = Math.min(damageTaken, ctx.game.drawPile.length);
    const flipped = ctx.game.drawPile.splice(0, flipCount);

    for (const card of flipped) {
      if (card.suit === 'heart') {
        ctx.player.hp = Math.min(ctx.player.hp + 1, ctx.player.maxHp);
      } else {
        ctx.player.handCards.push(card);
      }
    }
  },
};

export const shu015Skills: SkillPlugin[] = [huoshou, zaiqi];
