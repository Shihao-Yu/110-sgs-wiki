/**
 * QUN018 祝融 (Zhu Rong) — 野性的火神
 *
 * 烈刃 (Fierce Blade / Lieren): After dealing damage with 杀, draw 1 card
 * from the target.
 * 巨象 (Giant Elephant / Juxiang): Immune to 南蛮入侵; when one resolves,
 * acquire it.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN018 = 'QUN018' as GeneralId;

export const lieren: SkillPlugin = {
  id: 'qun_lieren',
  name: '烈刃',
  generalId: QUN018,
  type: 'passive',
  description: '当你使用【杀】对目标造成伤害后，你可以与其拼点，若你赢，获得其一张牌。',
  triggers: ['damage'],
  canActivate(ctx) {
    if (ctx.event.type !== 'damage') return false;
    if (ctx.event.source !== ctx.player.id) return false;
    const target = ctx.game.players.find(p => p.id === ctx.event.target);
    return target != null && target.alive && target.handCards.length > 0;
  },
  activate(ctx) {
    if (ctx.event.type !== 'damage') return;
    const target = ctx.game.players.find(p => p.id === ctx.event.target);
    if (!target || target.handCards.length === 0) return;
    // Simplified: take 1 card from target
    const [stolen] = target.handCards.splice(0, 1);
    ctx.player.handCards.push(stolen);
  },
};

export const juxiang: SkillPlugin = {
  id: 'qun_juxiang',
  name: '巨象',
  generalId: QUN018,
  type: 'passive',
  description: '锁定技，【南蛮入侵】对你无效。当一张【南蛮入侵】结算后，你获得之。',
  triggers: ['playCard'],
  canActivate: () => false,
  activate() { /* Requires AoE card resolution infrastructure */ },
};

export const qun018Skills: SkillPlugin[] = [lieren, juxiang];
