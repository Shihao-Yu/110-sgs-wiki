/**
 * WU073 孙翊 (alt) — 悍勇 (Hanyong / Fierce Valor, alt)
 * Passive skill (alternate version). Your Slash deals +1 damage when
 * your HP is 2 or less.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU073_GENERAL_ID = 'WU073' as GeneralId;

export const hanyongAlt: SkillPlugin = {
  id: 'hanyongAlt',
  name: '悍勇',
  generalId: WU073_GENERAL_ID,
  type: 'passive',
  description: 'Your Slash deals +1 damage when HP <= 2.',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    const card = ctx.event.card;
    return (
      ctx.event.player === ctx.player.id &&
      (card.name === 'Slash' || card.name === '杀') &&
      ctx.player.hp <= 2
    );
  },
  activate(ctx) {
    const targets = ctx.event.type === 'playCard' ? (ctx.event.targets ?? []) : [];
    const target = ctx.game.players.find(p => targets.includes(p.id));
    if (target) {
      // +1 bonus damage
      ctx.dealDamage(ctx.player, target, 1);
    }
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};
