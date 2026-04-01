/**
 * QUN012 诸葛亮(卧龙) (Zhuge Liang — Wolong) — 卧龙
 *
 * 火计 (Fire Attack / Huoji): Use a red hand card as 火攻 (Fire Attack).
 * 看破 (See Through / Kanpo): Use a black hand card as 无懈可击 (Negate).
 * 八阵 (Eight Diagram Formation / Bazhen): Compulsory — treated as having
 * 八卦阵 armor when not equipped with armor.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN012 = 'QUN012' as GeneralId;

export const huoji: SkillPlugin = {
  id: 'qun_huoji',
  name: '火计',
  generalId: QUN012,
  type: 'active',
  description: '你可以将一张红色手牌当【火攻】使用。',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    if (ctx.event.player !== ctx.player.id) return false;
    return ctx.player.handCards.some(c => c.suit === 'heart' || c.suit === 'diamond');
  },
  activate(ctx) {
    const idx = ctx.player.handCards.findIndex(c => c.suit === 'heart' || c.suit === 'diamond');
    if (idx === -1) return;
    const [card] = ctx.player.handCards.splice(idx, 1);
    ctx.game.discardPile.push(card);
    ctx.game.activeEffects.push({
      id: `huoji_${ctx.game.turnCount}`,
      name: 'huoji',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: [],
      duration: 'phase',
      properties: { fireAttack: true },
    });
  },
};

export const kanpo: SkillPlugin = {
  id: 'qun_kanpo',
  name: '看破',
  generalId: QUN012,
  type: 'active',
  description: '你可以将一张黑色手牌当【无懈可击】使用。',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    if (ctx.event.player !== ctx.player.id) return false;
    return ctx.player.handCards.some(c => c.suit === 'spade' || c.suit === 'club');
  },
  activate(ctx) {
    const idx = ctx.player.handCards.findIndex(c => c.suit === 'spade' || c.suit === 'club');
    if (idx === -1) return;
    const [card] = ctx.player.handCards.splice(idx, 1);
    ctx.game.discardPile.push(card);
    ctx.game.activeEffects.push({
      id: `kanpo_${ctx.game.turnCount}`,
      name: 'kanpo',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: [],
      duration: 'phase',
      properties: { negate: true },
    });
  },
};

export const bazhen: SkillPlugin = {
  id: 'qun_bazhen',
  name: '八阵',
  generalId: QUN012,
  type: 'passive',
  description: '锁定技，若你没有装备防具牌，你视为装备了【八卦阵】。',
  triggers: ['phaseChange'],
  canActivate(ctx) {
    if (ctx.event.type !== 'phaseChange') return false;
    if (ctx.event.phase !== 'prepare') return false;
    return ctx.event.player === ctx.player.id && ctx.player.equipment.armor === null;
  },
  activate(ctx) {
    ctx.game.activeEffects.push({
      id: `bazhen_${ctx.player.id}`,
      name: 'bazhen',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: [ctx.player.id],
      duration: 'permanent',
      properties: { virtualArmor: '八卦阵' },
    });
  },
};

export const qun012Skills: SkillPlugin[] = [huoji, kanpo, bazhen];
