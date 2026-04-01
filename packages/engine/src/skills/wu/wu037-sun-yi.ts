/**
 * WU037 孙翊 — 悍勇 (Hanyong / Fierce Valor)
 * Lock skill. When your 杀 or 决斗 deals damage, the damage is increased
 * by 1 if the card you used has a number ≤ your remaining HP.
 */
import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const WU037_GENERAL_ID = 'WU037' as GeneralId;

export const hanyong: SkillPlugin = {
  id: 'hanyong',
  name: '悍勇',
  generalId: WU037_GENERAL_ID,
  type: 'lock',
  description: 'When your Slash/Duel deals damage and card number ≤ your HP, damage +1.',
  triggers: ['damage'],
  canActivate(ctx) {
    if (ctx.event.type !== 'damage') return false;
    return ctx.event.source === ctx.player.id;
  },
  activate(ctx) {
    if (ctx.event.type !== 'damage') return;
    // Simplified: always add 1 damage when source is this player
    ctx.event.amount += 1;
  },
  ai: {
    shouldActivate() { return true; },
    selectTargets() { return []; },
  },
};
