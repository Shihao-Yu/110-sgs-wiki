/**
 * QUN016 蔡文姬 (Cai Wenji) — 才女
 *
 * 悲歌 (Elegy / Beige): When a player takes damage, you may discard 1 card,
 * then flip a judgment based on suit to apply different effects.
 * 断肠 (Heartbreak / Duanchang): When you die, the killer loses all skills.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN016 = 'QUN016' as GeneralId;

export const beige: SkillPlugin = {
  id: 'qun_beige',
  name: '悲歌',
  generalId: QUN016,
  type: 'passive',
  description: '当一名角色受到【杀】的伤害后，你可以弃置一张牌，然后进行判定，根据花色执行不同效果。',
  triggers: ['damage'],
  canActivate(ctx) {
    if (ctx.event.type !== 'damage') return false;
    return ctx.player.handCards.length > 0;
  },
  activate(ctx) {
    if (ctx.player.handCards.length === 0) return;
    const [discarded] = ctx.player.handCards.splice(0, 1);
    ctx.game.discardPile.push(discarded);
    // Simplified: draw 1 card for the damaged target as compensation
    const target = ctx.game.players.find(p => p.id === (ctx.event as { target: string }).target);
    if (target?.alive) {
      ctx.drawCards(target, 1);
    }
  },
};

export const duanchang: SkillPlugin = {
  id: 'qun_duanchang',
  name: '断肠',
  generalId: QUN016,
  type: 'passive',
  description: '锁定技，当你死亡时，杀死你的角色失去所有技能。',
  triggers: ['death'],
  canActivate(ctx) {
    if (ctx.event.type !== 'death') return false;
    return ctx.event.player === ctx.player.id && ctx.event.killer != null;
  },
  activate(ctx) {
    if (ctx.event.type !== 'death' || !ctx.event.killer) return;
    const killer = ctx.game.players.find(p => p.id === ctx.event.killer);
    if (killer) {
      killer.skills = [];
    }
  },
};

export const qun016Skills: SkillPlugin[] = [beige, duanchang];
